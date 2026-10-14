FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY *.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

RUN mkdir -p /app/wwwroot/uploads/music /app/wwwroot/uploads/images \
    && chown -R $APP_UID:$APP_UID /app/wwwroot

USER $APP_UID

ENTRYPOINT ["dotnet", "api.dll"]