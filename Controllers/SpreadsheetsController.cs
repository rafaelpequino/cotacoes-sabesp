using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            var spreadsheets = await _context.Spreadsheets
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

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
                return BadRequest(ModelState);

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
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? FilePath { get; set; }
        public string? FileType { get; set; }
        public long? FileSize { get; set; }
        public bool IsShared { get; set; } = false;
    }

    public class UpdateSpreadsheetRequest : CreateSpreadsheetRequest
    {
    }
}

