# ===== BUILD STAGE =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Seu .csproj está na raiz do repositório (conforme a imagem):
COPY ["CotacoesEPC.csproj", "./"]
RUN dotnet restore "./CotacoesEPC.csproj"

# Copie o restante do código e publique
COPY . .
RUN dotnet publish "./CotacoesEPC.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ===== RUNTIME STAGE =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Render injeta a porta via variável de ambiente PORT.
# O Kestrel precisa escutar nessa porta.
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
ENV DOTNET_RUNNING_IN
