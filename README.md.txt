# Andreas Receptapp

[Mobilutveckling - Andreas Olsson Andersson]

## Beskrivning

Receptappen är en mobilapp där användare kan hitta, skapa och dela recept. Användaren skapar ett konto, loggar in och kan sedan bläddra bland recept, söka och filtrera, spara favoriter och hantera sina egna recept.

Appen är byggd med React Native och Expo. Backend är ett eget REST API byggt med Spring Boot.

## Repostruktur

```
/
├── recipe-mobileapp/   React Native + Expo-appen
├── recipe-api/         Spring Boot-API med PostgreSQL (Docker)
└── README.md
```

## REST API

Appen använder ett eget API (Spring Boot, Java 21) med PostgreSQL som databas i Docker. Inloggning sker med JWT.

Bas-URL: `http://<datorns-IP>:8080/api`

| Metod | Endpoint | Skyddad | Beskrivning |
|-------|----------|---------|-------------|
| POST | `/auth/register` | Nej | Skapa konto |
| POST | `/auth/login` | Nej | Logga in |
| GET | `/recipes?search=&categoryId=` | Nej* | Hämta och filtrera recept |
| GET | `/recipes/{id}` | Nej* | Hämta ett recept |
| POST | `/recipes` | Ja | Skapa recept |
| PUT | `/recipes/{id}` | Ja | Ändra eget recept |
| DELETE | `/recipes/{id}` | Ja | Ta bort eget recept |
| GET | `/categories` | Nej | Hämta kategorier |
| GET | `/favorites` | Ja | Hämta egna favoriter |
| POST | `/favorites/{recipeId}` | Ja | Lägg till favorit |
| DELETE | `/favorites/{recipeId}` | Ja | Ta bort favorit |

\*I appen kräver hela receptdelen inloggning, eftersom skärmarna bara visas för inloggade användare. API:et tillåter GET utan token.

Endast receptets ägare kan ändra eller ta bort det. Andra användare får svaret 403.

## Funktioner

- Startsida med information om appen
- Registrering och inloggning
- Skyddade skärmar för inloggade användare
- Receptlista och detaljvy
- Sökning på titel och filtrering på kategori
- Skapa, redigera och ta bort egna recept
- Favoriter med egen favoritlista
- Dela recept
- Loading-indikator, felmeddelanden och tomma resultat
- Återkoppling vid inloggning, utloggning, skapa, uppdatera och ta bort
- Anpassad layout för olika skärmstorlekar och grundläggande accessibility (roller, etiketter, tillräckligt stora tryckytor)

## Registrering och inloggning

1. Användaren registrerar sig med namn, e-post och lösenord (minst 6 tecken). Appen validerar fälten innan anropet skickas.
2. API:et sparar användaren med lösenordet hashat med BCrypt och svarar med en JWT-token.
3. Vid inloggning kontrollerar API:et e-post och lösenord och returnerar en ny token. Token gäller i 24 timmar.
4. Appen sparar token och användaruppgifter i SecureStore och skickar token i headern `Authorization: Bearer <token>`.
5. `RootNavigator` visar olika skärmar beroende på om det finns en token. Utloggade ser startsida, inloggning och registrering. Inloggade ser recepten.
6. Vid utloggning raderas token och användaruppgifter ur SecureStore.

Lösenordet sparas aldrig lokalt.

## Lokal lagring

- **SecureStore** (`expo-secure-store`): token och användaruppgifter (id, namn, e-post).
- **AsyncStorage** (`@react-native-async-storage/async-storage`): senaste sökord och vald kategori, som återställs när appen startas igen.

## Mobilfunktion

**Share** (React Native): användaren kan dela ett recept som text, med titel, ingredienser och instruktioner, via telefonens delningsmeny.

## Installation

### Förutsättningar

- Node.js och npm
- Java 21
- Docker Desktop
- Android Studio med en emulator (eller Expo Go på en fysisk telefon)

### 1. Databas

Starta PostgreSQL i Docker från mappen `recipe-api`:

```
docker compose up -d
```

Databasen heter `recipes` med användaren `recipe_user`. Lösenordet (`POSTGRES_PASSWORD`) i `docker-compose.yml` är ett exempelvärde och måste vara samma som `DB_PASSWORD` nedan.

### 2. API

Sätt följande miljövariabler (till exempel i IntelliJ under Run → Edit Configurations → Environment variables):

```
DB_URL=jdbc:postgresql://localhost:5432/recipes
DB_USER=recipe_user
DB_PASSWORD=<samma lösenord som i docker-compose.yml>
JWT_SECRET=<minst 32 tecken>
```

### 3. Appen

I mappen `recipe-mobileapp`:

```
npm install
```

## Starta projektet

1. Starta Docker-databasen och sedan API:et. Kör `RecipeApiApplication` i IntelliJ, eller `gradlew bootRun` med miljövariablerna satta. API:et körs på port 8080. Kategorier skapas automatiskt vid första starten.
2. Ta reda på datorns IPv4-adress med `ipconfig` (Windows) och ange den i `recipe-mobileapp/constants/api.js`:
   ```js
   export const BASE_URL = 'http://<datorns-IP>:8080/api';
   ```
3. Starta appen från mappen `recipe-mobileapp`:
   ```
   npx expo start
   ```
4. Tryck `a` för att öppna Android-emulatorn.

## Testa applikationen

1. Starta databasen, API:et och appen enligt stegen ovan.
2. Tryck på **Skapa konto** på startsidan och registrera ett eget konto.
3. Det finns inga recept från början. Tryck på **Nytt recept** för att skapa ett. Kategorierna (Huvudrätt, Efterrätt, Förrätt, Bakning) finns redan.
4. Testa sedan:
   - Öppna ett recept och tryck på **Favorit** och **Dela recept**
   - **Redigera** och **Ta bort** på ett eget recept (knapparna visas bara för receptets ägare)
   - Sök och filtrera i listan
   - **Favoriter** och **Logga ut** i knapparna överst i listan
5. API:et kan också testas direkt i ett verktyg som Bruno eller Postman med endpoints i tabellen ovan.

## Kända problem och begränsningar

- Hela receptdelen kräver inloggning. Det finns ingen offentlig vy för utloggade och ingen profilskärm.
- `BASE_URL` är hårdkodad och måste uppdateras om datorns IP-adress ändras.
- Appen använder okrypterad HTTP mot API:et, vilket är avsett för utveckling.
- När token går ut efter 24 timmar loggas användaren inte ut automatiskt, och ett 401-svar visas som "Fel e-post eller lösenord".
- Valideringsfel från API:et visas som ett generellt felmeddelande.
- Det finns bara en användarroll. Admin och liknande roller är inte implementerade.
- Ingredienser skrivs in separat för varje recept.
- Appen är låst till stående läge och roterar inte till liggande.
