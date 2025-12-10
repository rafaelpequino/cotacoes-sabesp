using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IWebHostEnvironment _hostEnvironment;

        public FilesController(IWebHostEnvironment hostEnvironment)
        {
            _hostEnvironment = hostEnvironment;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // POST: api/files/upload
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Arquivo não fornecido ou está vazio" });

                // Validar tipo de arquivo
                var allowedExtensions = new[] { ".xlsx", ".xls", ".csv" };
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest(new { message = "Tipo de arquivo não permitido. Use .xlsx, .xls ou .csv" });

                // Validar tamanho (máximo 10MB)
                if (file.Length > 10 * 1024 * 1024)
                    return BadRequest(new { message = "Arquivo muito grande. Máximo 10MB" });

                var userId = GetUserId();
                var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "uploads", userId.ToString());
                
                // Criar pasta do usuário se não existir
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                // Gerar nome único para o arquivo
                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Salvar arquivo
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new 
                { 
                    success = true,
                    fileName = file.FileName,
                    fileKey = fileName,
                    fileSize = file.Length,
                    fileType = fileExtension.TrimStart('.'),
                    message = "Arquivo enviado com sucesso!"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Erro ao fazer upload: {ex.Message}" });
            }
        }

        // GET: api/files/download/{fileKey}
        [HttpGet("download/{fileKey}")]
        public IActionResult Download(string fileKey)
        {
            try
            {
                if (string.IsNullOrEmpty(fileKey))
                    return BadRequest(new { message = "Chave do arquivo não fornecida" });

                var userId = GetUserId();
                var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "uploads", userId.ToString());
                var filePath = Path.Combine(uploadsFolder, fileKey);

                // Validar que o arquivo pertence ao usuário
                if (!System.IO.File.Exists(filePath))
                    return NotFound(new { message = "Arquivo não encontrado" });

                var fileName = fileKey.Substring(fileKey.IndexOf('_') + 1);
                var fileBytes = System.IO.File.ReadAllBytes(filePath);
                var contentType = GetContentType(fileKey);

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Erro ao fazer download: {ex.Message}" });
            }
        }

        private string GetContentType(string fileName)
        {
            return fileName.EndsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :
                   fileName.EndsWith(".xls") ? "application/vnd.ms-excel" :
                   fileName.EndsWith(".csv") ? "text/csv" :
                   "application/octet-stream";
        }
    }
}

