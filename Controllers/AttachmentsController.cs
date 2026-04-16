using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IO.Compression;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttachmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<AttachmentsController> _logger;

        public AttachmentsController(
            ApplicationDbContext context, 
            IWebHostEnvironment env,
            ILogger<AttachmentsController> logger)
        {
            _context = context;
            _env = env;
            _logger = logger;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/attachments?entityType=Service&entityId=1
        [HttpGet]
        public async Task<IActionResult> GetAttachments([FromQuery] string entityType, [FromQuery] int entityId)
        {
            var userId = GetUserId();

            // Verificar se o usuário tem permissão para ver os anexos desta entidade
            bool hasAccess = entityType.ToLower() switch
            {
                "quotation" => await _context.Quotations.AnyAsync(q => q.Id == entityId && q.UserId == userId),
                _ => false
            };

            if (!hasAccess)
                return Forbid();

            var attachments = await _context.Attachments
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .Select(a => new
                {
                    a.Id,
                    a.OriginalFileName,
                    a.Description,
                    a.CompanyName,
                    a.FileSize,
                    a.UploadedAt,
                    a.UserId,
                    CanEdit = a.UserId == userId
                })
                .ToListAsync();

            return Ok(attachments);
        }

        // POST: api/attachments/upload
        [HttpPost("upload")]
        [RequestSizeLimit(10485760)] // 10 MB
        public async Task<IActionResult> UploadAttachment(
            [FromForm] string entityType, 
            [FromForm] int entityId, 
            [FromForm] IFormFile file,
            [FromForm] string description,
            [FromForm] string? companyName = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Nenhum arquivo foi enviado" });

                // Validar tipo de arquivo (somente PDF)
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (extension != ".pdf")
                    return BadRequest(new { message = "Somente arquivos PDF são permitidos" });

                // Validar tamanho do arquivo (máximo 10 MB)
                if (file.Length > 10485760)
                    return BadRequest(new { message = "O arquivo não pode ter mais de 10 MB" });

                var userId = GetUserId();

                // Verificar se o usuário tem permissão para adicionar anexos a esta entidade
                bool hasAccess = entityType.ToLower() switch
                {
                    "quotation" => await _context.Quotations.AnyAsync(q => q.Id == entityId && q.UserId == userId),
                    _ => false
                };

                if (!hasAccess)
                    return Forbid();

                // Gerar nome único para o arquivo
                var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");
                var sanitizedOriginalName = Path.GetFileNameWithoutExtension(file.FileName)
                    .Replace(" ", "_")
                    .Replace("-", "_");
                var storedFileName = $"{entityType}_{entityId}_{timestamp}_{sanitizedOriginalName}{extension}";

                // Definir caminho de salvamento
                var attachmentsPath = Path.Combine(_env.WebRootPath, "attachments");
                if (!Directory.Exists(attachmentsPath))
                {
                    Directory.CreateDirectory(attachmentsPath);
                }

                var filePath = Path.Combine(attachmentsPath, storedFileName);

                // Salvar arquivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Validar descrição
                if (string.IsNullOrWhiteSpace(description))
                    return BadRequest(new { message = "A descrição do anexo é obrigatória" });

                // Criar registro no banco de dados
                var attachment = new Attachment
                {
                    OriginalFileName = file.FileName,
                    StoredFileName = storedFileName,
                    FilePath = $"/attachments/{storedFileName}",
                    FileExtension = extension,
                    FileSize = file.Length,
                    EntityType = entityType,
                    EntityId = entityId,
                    UserId = userId,
                    Description = description,
                    CompanyName = string.IsNullOrWhiteSpace(companyName) ? null : companyName.Trim(),
                    UploadedAt = DateTime.UtcNow
                };

                _context.Attachments.Add(attachment);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    attachment.Id,
                    attachment.OriginalFileName,
                    attachment.Description,
                    attachment.CompanyName,
                    attachment.FileSize,
                    attachment.UploadedAt,
                    CanEdit = true
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao fazer upload de anexo");
                return StatusCode(500, new { message = "Erro ao fazer upload do arquivo" });
            }
        }

        // DELETE: api/attachments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttachment(int id)
        {
            try
            {
                var userId = GetUserId();
                var attachment = await _context.Attachments
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (attachment == null)
                    return NotFound(new { message = "Anexo não encontrado" });

                // Somente o usuário que fez o upload pode deletar
                if (attachment.UserId != userId)
                    return Forbid();

                // Deletar arquivo físico
                var filePath = Path.Combine(_env.WebRootPath, "attachments", attachment.StoredFileName);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Deletar registro do banco
                _context.Attachments.Remove(attachment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Anexo deletado com sucesso" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar anexo");
                return StatusCode(500, new { message = "Erro ao deletar anexo" });
            }
        }

        // GET: api/attachments/{id}/download
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadAttachment(int id)
        {
            try
            {
                var userId = GetUserId();
                var attachment = await _context.Attachments
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (attachment == null)
                    return NotFound(new { message = "Anexo não encontrado" });

                // Verificar se o usuário tem acesso à entidade deste anexo
                bool hasAccess = attachment.EntityType.ToLower() switch
                {
                    "quotation" => await _context.Quotations.AnyAsync(q => q.Id == attachment.EntityId && q.UserId == userId),
                    _ => false
                };

                if (!hasAccess)
                    return Forbid();

                var filePath = Path.Combine(_env.WebRootPath, "attachments", attachment.StoredFileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "Arquivo não encontrado no servidor" });

                var memory = new MemoryStream();
                using (var stream = new FileStream(filePath, FileMode.Open))
                {
                    await stream.CopyToAsync(memory);
                }
                memory.Position = 0;

                return File(memory, "application/pdf", attachment.OriginalFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao baixar anexo");
                return StatusCode(500, new { message = "Erro ao baixar anexo" });
            }
        }

        // GET: api/attachments/download-all?entityType=Service&entityId=1
        [HttpGet("download-all")]
        public async Task<IActionResult> DownloadAllAttachments([FromQuery] string entityType, [FromQuery] int entityId)
        {
            try
            {
                var userId = GetUserId();

                // Verificar se o usuário tem permissão para acessar esta entidade
                bool hasAccess = entityType.ToLower() switch
                {
                    "quotation" => await _context.Quotations.AnyAsync(q => q.Id == entityId && q.UserId == userId),
                    _ => false
                };

                if (!hasAccess)
                    return Forbid();

                // Buscar todos os anexos desta entidade
                var attachments = await _context.Attachments
                    .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                    .ToListAsync();

                if (attachments.Count == 0)
                    return NotFound(new { message = "Nenhum anexo encontrado" });

                // Criar arquivo ZIP em memória
                using var memoryStream = new MemoryStream();
                using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
                {
                    foreach (var attachment in attachments)
                    {
                        var filePath = Path.Combine(_env.WebRootPath, "attachments", attachment.StoredFileName);

                        if (System.IO.File.Exists(filePath))
                        {
                            // Criar entrada no ZIP com o nome original do arquivo
                            var zipEntry = archive.CreateEntry(attachment.OriginalFileName, CompressionLevel.Optimal);

                            using var zipEntryStream = zipEntry.Open();
                            using var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
                            await fileStream.CopyToAsync(zipEntryStream);
                        }
                    }
                }

                memoryStream.Position = 0;

                // Gerar nome do arquivo ZIP
                var zipFileName = $"{entityType}_{entityId}_anexos_{DateTime.UtcNow:yyyyMMddHHmmss}.zip";

                return File(memoryStream.ToArray(), "application/zip", zipFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao baixar anexos em ZIP");
                return StatusCode(500, new { message = "Erro ao criar arquivo ZIP" });
            }
        }
    }
}
