using CotacoesEPC.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/dashboard/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();

            var servicesCount = await _context.Services
                .Where(s => s.UserId == userId)
                .CountAsync();

            var inputsCount = await _context.Inputs
                .Where(i => i.UserId == userId)
                .CountAsync();

            var spreadsheetsCount = await _context.Spreadsheets
                .Where(s => s.UserId == userId)
                .CountAsync();

            var recentServices = await _context.Services
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Take(3)
                .Select(s => new
                {
                    s.Id,
                    s.OriginalId,
                    s.Item,
                    s.PrecoAdotado,
                    s.CreatedAt,
                    ResponsibleName = s.User!.Name
                })
                .ToListAsync();

            var recentInputs = await _context.Inputs
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.CreatedAt)
                .Take(3)
                .Select(i => new
                {
                    i.Id,
                    i.Item,
                    i.PrecoAdotado,
                    i.CreatedAt,
                    ResponsibleName = i.User!.Name
                })
                .ToListAsync();

            var recentSpreadsheets = await _context.Spreadsheets
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Take(3)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.FilePath,
                    s.CreatedAt,
                    ResponsibleName = s.User!.Name
                })
                .ToListAsync();

            return Ok(new
            {
                servicesCount,
                inputsCount,
                spreadsheetsCount,
                recentServices,
                recentInputs,
                recentSpreadsheets
            });
        }

        // GET: api/dashboard/statistics
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var userId = GetUserId();

            var totalServicesValue = await _context.Services
                .Where(s => s.UserId == userId)
                .SumAsync(s => s.PrecoAdotado);

            var totalInputsValue = await _context.Inputs
                .Where(i => i.UserId == userId)
                .SumAsync(i => i.PrecoAdotado);

            var averageServicePrice = await _context.Services
                .Where(s => s.UserId == userId)
                .AverageAsync(s => (decimal?)s.PrecoAdotado) ?? 0;

            var averageInputPrice = await _context.Inputs
                .Where(i => i.UserId == userId)
                .AverageAsync(i => (decimal?)i.PrecoAdotado) ?? 0;

            return Ok(new
            {
                totalServicesValue,
                totalInputsValue,
                averageServicePrice,
                averageInputPrice
            });
        }
    }
}

