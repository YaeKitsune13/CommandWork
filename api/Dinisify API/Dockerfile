FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Dinisify API/Dinisify API.csproj", "Dinisify API/"]
RUN dotnet restore "Dinisify API/Dinisify API.csproj"

COPY . .
WORKDIR "/src/Dinisify API"
RUN dotnet publish "Dinisify API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Dinisify API.dll"]
