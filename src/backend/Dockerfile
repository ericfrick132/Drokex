# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj and restore as distinct layers (paths are relative to build context: src/backend)
COPY Dockex.API/Dockex.API.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY Dockex.API/ ./
RUN dotnet publish -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out ./

# Create a non-root user (no extra packages)
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

EXPOSE 5000
ENTRYPOINT ["dotnet", "Dockex.API.dll"]
