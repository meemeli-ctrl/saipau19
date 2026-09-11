# Työskentelysäännöt – kaikille AI-koodausavustimille

Tässä työtilassa on samaan aikaan käytössä useampi AI-avustin (esim. Claude
Code, Antigravity, GitHub Copilot). Jos jokainen tekee git- ja
julkaisuoperaatioita omin päin, ne kirjoittavat toistensa työn päälle ilman
että kukaan huomaa. Siksi: **kaikki noudattavat tätä samaa sääntöä**,
riippumatta siitä minkä työkalun kautta muokkaus tehdään.

## Kolme erillistä vaihetta – jokainen vaatii oman, nimenomaisen käskyn

1. **Muokkaus (oletus).** Tiedostoja saa muokata, buildata ja testata
   paikallisesti aina vapaasti, ilman erillistä lupaa.
2. **Julkaisu GitHubiin.** `git add` / `commit` / `push` tehdään **vain**
   kun käyttäjä pyytää sitä nimenomaisesti tässä keskustelussa (esim.
   "committaa", "pushaa", "vie GitHubiin"). Ei koskaan automaattisesti
   muokkauksen yhteydessä, vaikka muutos olisi kuinka valmis tahansa.
3. **Julkaisu Firebaseen / tuotantoon.** `firebase deploy` (hosting,
   `firestore:rules`, tai mikä tahansa muu `--only`) tehdään **vain** kun
   käyttäjä pyytää sitä **erikseen**, eri käskyllä kuin GitHub-julkaisu.
   Deploy tehdään sen mukaan mitä **GitHubissa** on – ei suoraan paikallisesta,
   mahdollisesti pushaamattomasta tilasta. Virtaus on siis aina:

   ```
   paikallinen työkopio → (käsky) → GitHub → (eri käsky) → Firebase/tuotanto
   ```

   Ei koskaan paikallinen → Firebase suoraan.

## Kielletty ilman käyttäjän nimenomaista pyyntöä juuri sillä hetkellä

- `git commit`, `git push`, `git merge`, `git rebase`, `git reset --hard`,
  `git checkout` joka hylkää tallentamattomia muutoksia
- `firebase deploy` missään muodossa
- Toisen avustimen tekemän committin, tiedoston tai ominaisuuden
  päällekirjoitus/reverttaus omin päin

## Jos huomaat toisen avustimen tehneen muutoksia

Tiedostot voivat muuttua levyllä toisen avustimen toimesta kesken oman
istuntosi – älä oleta että viimeksi lukemasi versio on ainoa totuus.
Ennen committia: tarkista `git status` / `git diff` / `git log`. Jos löydät
ristiriitaisia muutoksia (esim. ominaisuus jonka joku toinen on poistanut),
**kerro käyttäjälle mitä löysit ennen kuin päällekirjoitat mitään** –
älä ratkaise ristiriitaa yksipuolisesti.

## Huom. Antigravity / muut työkalut

Tämä tiedosto on kanoninen lähde. Jos työkalusi ei lue `AGENTS.md`-tiedostoa
automaattisesti, tarkista sen omista asetuksista (esim. "Rules"/"Memories"
-paneeli) miten sille kerrotaan noudattamaan tätä samaa tiedostoa.
