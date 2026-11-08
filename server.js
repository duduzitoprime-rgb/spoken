
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SPOKEN</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0f0f0f;color:white;font-family:Arial}
header{height:65px;background:#181818;display:flex;
align-items:center;padding:0 25px;border-bottom:1px solid #333}
.logo{font-size:27px;font-weight:bold;color:#ff3030}
main{padding:35px}
h1{font-size:28px}
.empty{margin-top:80px;text-align:center;color:#aaa}
.empty h2{color:white}
</style>
</head>
<body>
<header>
<div class="logo">SPOKEN</div>
</header>
<main>
<h1>Início</h1>
<div class="empty">
<h2>🎬 Ainda não há vídeos!</h2>
<p>Quando alguém publicar um vídeo, ele aparecerá aqui.</p>
</div>
</main>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("SPOKEN online na porta " + PORT);
});
