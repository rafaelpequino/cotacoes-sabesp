using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SectorsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SectorsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/sectors
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sectors = await _context.Sectors
                .Where(s => s.IsActive)
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(sectors);
        }

        // GET: api/sectors/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sector = await _context.Sectors
                .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

            if (sector == null)
                return NotFound(new { message = "Setor não encontrado" });

            return Ok(sector);
        }
    }
}
