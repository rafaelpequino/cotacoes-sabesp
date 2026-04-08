using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SpreadsheetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SpreadsheetsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/spreadsheets/sectors
        [HttpGet("sectors")]
        public async Task<IActionResult> GetSectors()
        {
            var sectors = await _context.Sectors
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(sectors);
        }

        // GET: api/spreadsheets
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? search, 
            [FromQuery] int? sectorId,
            [FromQuery] int? i0StartMonth,
            [FromQuery] int? i0StartYear,
            [FromQuery] int? i0EndMonth,
            [FromQuery] int? i0EndYear)
        {
            var userId = GetUserId();
            // Mostrar TODAS as planilhas (compartilhadas entre usuários)
            var query = _context.Spreadsheets.AsQueryable();

            // Aplicar filtro de texto
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s => 
                    s.Name.ToLower().Contains(searchLower) ||
                    (s.Description != null && s.Description.ToLower().Contains(searchLower))
                );
            }

            // Aplicar filtro por setor
            if (sectorId.HasValue && sectorId.Value > 0)
            {
                query = query.Where(s => s.SectorId == sectorId);
            }

            // Aplicar ordenação padrão
            query = query.OrderByDescending(s => s.CreatedAt);

            var spreadsheets = await query.ToListAsync();

            // Aplicar filtro por range de I0 (em memória)
            if (i0StartMonth.HasValue || i0StartYear.HasValue || i0EndMonth.HasValue || i0EndYear.HasValue)
            {
                spreadsheets = FilterByI0Range(spreadsheets, i0StartMonth, i0StartYear, i0EndMonth, i0EndYear).ToList();
            }

            return Ok(spreadsheets);
        }

        private IEnumerable<Spreadsheet> FilterByI0Range(
            IEnumerable<Spreadsheet> spreadsheets,
            int? startMonth,
            int? startYear,
            int? endMonth,
            int? endYear)
        {
            return spreadsheets.Where(s => IsI0InRange(s.I0Month, s.I0Year, startMonth, startYear, endMonth, endYear));
        }

        private bool IsI0InRange(int? i0Month, int? i0Year, int? startMonth, int? startYear, int? endMonth, int? endYear)
        {
            // Se não há I0 na planilha, não incluir
            if (!i0Month.HasValue || !i0Year.HasValue)
                return false;

            // Se não há filtro de range, incluir
            if (!startMonth.HasValue && !startYear.HasValue && !endMonth.HasValue && !endYear.HasValue)
                return true;

            // Comparação: ano.mês (ex: 2025.01)
            var i0Value = i0Year.Value * 100 + i0Month.Value;

            // Verificar limite inferior
            if (startYear.HasValue && startMonth.HasValue)
            {
                var startValue = startYear.Value * 100 + startMonth.Value;
                if (i0Value < startValue)
                    return false;
            }
            else if (startYear.HasValue && !startMonth.HasValue)
            {
                if (i0Year.Value < startYear.Value)
                    return false;
            }

            // Verificar limite superior
            if (endYear.HasValue && endMonth.HasValue)
            {
                var endValue = endYear.Value * 100 + endMonth.Value;
                if (i0Value > endValue)
                    return false;
            }
            else if (endYear.HasValue && !endMonth.HasValue)
            {
                if (i0Year.Value > endYear.Value)
                    return false;
            }

            return true;
        }

        // GET: api/spreadsheets/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            // Permitir visualização de qualquer planilha (todos podem ver, mas só podem editar/deletar as suas)
            var spreadsheet = await _context.Spreadsheets
                .FirstOrDefaultAsync(s => s.Id == id);

            if (spreadsheet == null)
                return NotFound(new { message = "Planilha não encontrada" });

            return Ok(spreadsheet);
        }

        // POST: api/spreadsheets
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSpreadsheetRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors);
                var errorMessages = errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(new { 
                    message = "Erro de validação",
                    errors = errorMessages
                });
            }

            try
            {
                var userId = GetUserId();

                var spreadsheet = new Spreadsheet
                {
                    UserId = userId,
                    Name = request.Name,
                    Description = request.Description,
                    SectorId = request.SectorId,
                    I0Month = request.I0Month,
                    I0Year = request.I0Year,
                    FilePath = request.FilePath,
                    FileType = request.FileType,
                    FileSize = request.FileSize,
                    IsShared = request.IsShared,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Spreadsheets.Add(spreadsheet);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = spreadsheet.Id }, spreadsheet);
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    message = "Ocorreu um erro ao processar sua requisição. Tente novamente mais tarde.",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message
                });
            }
        }

        // PUT: api/spreadsheets/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSpreadsheetRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var spreadsheet = await _context.Spreadsheets
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (spreadsheet == null)
                return NotFound(new { message = "Planilha não encontrada" });

            spreadsheet.Name = request.Name;
            spreadsheet.Description = request.Description;
            spreadsheet.SectorId = request.SectorId;
            spreadsheet.I0Month = request.I0Month;
            spreadsheet.I0Year = request.I0Year;
            spreadsheet.FilePath = request.FilePath;
            spreadsheet.FileType = request.FileType;
            spreadsheet.FileSize = request.FileSize;
            spreadsheet.IsShared = request.IsShared;
            spreadsheet.UpdatedAt = DateTime.UtcNow;

            if (request.IsShared)
                spreadsheet.SharedAt = DateTime.UtcNow;

            _context.Spreadsheets.Update(spreadsheet);
            await _context.SaveChangesAsync();

            return Ok(spreadsheet);
        }

        // GET: api/spreadsheets/{id}/download
        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var userId = GetUserId();
            var spreadsheet = await _context.Spreadsheets
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (spreadsheet == null)
                return NotFound(new { message = "Planilha não encontrada" });

            if (string.IsNullOrEmpty(spreadsheet.FilePath))
                return BadRequest(new { message = "Arquivo não disponível para download" });

            // Criar um arquivo de resposta com os dados salvos
            // Por enquanto, retornando metadados para download
            return Ok(new { 
                fileName = spreadsheet.FilePath,
                name = spreadsheet.Name,
                fileSize = spreadsheet.FileSize,
                fileType = spreadsheet.FileType,
                message = "Para fazer download, use o nome do arquivo acima"
            });
        }

        // DELETE: api/spreadsheets/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var spreadsheet = await _context.Spreadsheets
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (spreadsheet == null)
                return NotFound(new { message = "Planilha não encontrada" });

            _context.Spreadsheets.Remove(spreadsheet);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Planilha deletada com sucesso" });
        }
    }

    public class CreateSpreadsheetRequest
    {
        [Required(ErrorMessage = "Nome da planilha é obrigatório")]
        [StringLength(255, ErrorMessage = "Nome não pode exceder 255 caracteres")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Descrição não pode exceder 1000 caracteres")]
        public string? Description { get; set; }

        public int? SectorId { get; set; }

        [StringLength(500, ErrorMessage = "Caminho do arquivo não pode exceder 500 caracteres")]
        public string? FilePath { get; set; }

        [StringLength(255, ErrorMessage = "Tipo de arquivo não pode exceder 255 caracteres")]
        public string? FileType { get; set; }

        public long? FileSize { get; set; }

        public bool IsShared { get; set; } = false;

        [Range(1, 12, ErrorMessage = "Mês do I0 deve estar entre 1 e 12")]
        public int? I0Month { get; set; }

        [Range(2020, 2099, ErrorMessage = "Ano do I0 deve estar entre 2020 e 2099")]
        public int? I0Year { get; set; }
    }

    public class UpdateSpreadsheetRequest : CreateSpreadsheetRequest
    {
    }
}

