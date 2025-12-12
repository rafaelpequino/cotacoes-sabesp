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

        // GET: api/spreadsheets
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? sort, [FromQuery] string? filter)
        {
            var userId = GetUserId();
            var query = _context.Spreadsheets.Where(s => s.UserId == userId);

            // Aplicar filtro de texto
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s => 
                    s.Name.ToLower().Contains(searchLower) ||
                    s.Description.ToLower().Contains(searchLower)
                );
            }

            // Aplicar ordenação
            query = sort switch
            {
                "recentes" => query.OrderByDescending(s => s.CreatedAt),
                "antigos" => query.OrderBy(s => s.CreatedAt),
                _ => query.OrderByDescending(s => s.CreatedAt) // Relevância/padrão
            };

            // Aplicar filtro de categoria (Minhas Planilhas / Compartilhadas)
            if (filter == "compartilhadas")
            {
                query = query.Where(s => s.IsShared);
            }

            var spreadsheets = await query.ToListAsync();

            return Ok(spreadsheets);
        }

        // GET: api/spreadsheets/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var spreadsheet = await _context.Spreadsheets
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

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

            var userId = GetUserId();

            var spreadsheet = new Spreadsheet
            {
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
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

        [StringLength(500, ErrorMessage = "Caminho do arquivo não pode exceder 500 caracteres")]
        public string? FilePath { get; set; }

        [StringLength(255, ErrorMessage = "Tipo de arquivo não pode exceder 255 caracteres")]
        public string? FileType { get; set; }

        public long? FileSize { get; set; }

        public bool IsShared { get; set; } = false;
    }

    public class UpdateSpreadsheetRequest : CreateSpreadsheetRequest
    {
    }
}

