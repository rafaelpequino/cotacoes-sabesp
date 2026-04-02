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
    public class SuppliersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SuppliersController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/suppliers
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? sort)
        {
            var query = _context.Suppliers.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var words = search.ToLower()
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                foreach (var word in words)
                {
                    var w = word;
                    query = query.Where(s =>
                        s.NomeFantasia.ToLower().Contains(w) ||
                        s.CNPJ.ToLower().Contains(w) ||
                        s.Telefone.ToLower().Contains(w) ||
                        s.Endereco.ToLower().Contains(w)
                    );
                }
            }

            query = sort switch
            {
                "recentes" => query.OrderByDescending(s => s.DataCadastro),
                "antigos" => query.OrderBy(s => s.DataCadastro),
                "nome" => query.OrderBy(s => s.NomeFantasia),
                _ => query.OrderByDescending(s => s.DataCadastro)
            };

            var suppliers = await query.ToListAsync();
            return Ok(suppliers);
        }

        // GET: api/suppliers/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == id);
            if (supplier == null)
                return NotFound(new { message = "Fornecedor não encontrado" });

            return Ok(supplier);
        }

        // POST: api/suppliers
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupplierRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var supplier = new Supplier
            {
                NomeFantasia = request.NomeFantasia ?? string.Empty,
                CNPJ = request.CNPJ ?? string.Empty,
                Telefone = request.Telefone ?? string.Empty,
                Endereco = request.Endereco ?? string.Empty,
                DataCadastro = DateTime.UtcNow
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = supplier.Id }, supplier);
        }

        // PUT: api/suppliers/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierRequest request)
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == id);
            if (supplier == null)
                return NotFound(new { message = "Fornecedor não encontrado" });

            supplier.NomeFantasia = request.NomeFantasia ?? supplier.NomeFantasia;
            supplier.CNPJ = request.CNPJ ?? supplier.CNPJ;
            supplier.Telefone = request.Telefone ?? supplier.Telefone;
            supplier.Endereco = request.Endereco ?? supplier.Endereco;
            supplier.UpdatedAt = DateTime.UtcNow;

            _context.Suppliers.Update(supplier);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Fornecedor atualizado com sucesso", supplier });
        }

        // DELETE: api/suppliers/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.Id == id);
            if (supplier == null)
                return NotFound(new { message = "Fornecedor não encontrado" });

            // Check if supplier is being used in quotations
            var quotationCount = await _context.Quotations
                .Where(q => q.Supplier1Id == id || q.Supplier2Id == id || q.Supplier3Id == id || 
                           q.Supplier4Id == id || q.Supplier5Id == id || q.Supplier6Id == id)
                .CountAsync();

            if (quotationCount > 0)
                return BadRequest(new { message = "Não é possível deletar fornecedor que está em uso" });

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Fornecedor deletado com sucesso" });
        }
    }

    public class CreateSupplierRequest
    {
        public string? NomeFantasia { get; set; }
        public string? CNPJ { get; set; }
        public string? Telefone { get; set; }
        public string? Endereco { get; set; }
    }

    public class UpdateSupplierRequest
    {
        public string? NomeFantasia { get; set; }
        public string? CNPJ { get; set; }
        public string? Telefone { get; set; }
        public string? Endereco { get; set; }
    }
}
