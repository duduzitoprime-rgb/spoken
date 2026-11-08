
const express = require("express");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const BUCKET = "spoken-videos";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  throw new Error("Configure as variáveis do Supabase no Render.");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype.startsWith("video/"));
  }
});

app.get("/api/videos", async (req, res) => {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" }
    });

  if (error) return res.status(500).json({ error: "Erro ao carregar vídeos." });

  const videos = (data || [])
    .filter(file => file.name && file.name !== ".emptyFolderPlaceholder")
    .map(file => {
      const path = file.name;
      const { data: publicData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      return {
        title: path.replace(/^[0-9]+-[a-f0-9-]+-/, "").replace(/[-_]/g, " "),
        url: publicData.publicUrl
      };
    });

  res.json(videos);
});

app.post("/api/videos", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Selecione um vídeo válido." });
    }

    const title = String(req.body.title || "Vídeo sem título")
      .replace(/[^\p{L}\p{N} _-]/gu, "")
      .trim()
      .slice(0, 80) || "Vídeo sem título";

    const extension = req.file.originalname.split(".").pop().replace(/[^a-zA-Z0-9]/g, "");
    const path = `${Date.now()}-${randomUUID()}-${title.replace(/\s+/g, "-")}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      return res.status(500).json({ error: "Não foi possível publicar o vídeo." });
    }

    res.json({ success: true, message: "Vídeo publicado!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao publicar o vídeo." });
  }
});

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SPOKEN</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#0f0f0f;color:white;font-family:Arial}
header{height:65px;background:#181818;display:flex;align-items:center;padding:0 25px;border-bottom:1px solid #333;justify-content:space-between}
.logo{font-size:27px;font-weight:bold;color:#ff3030}
button{background:#ff3030;color:white;border:0;padding:12px 18px;border-radius:8px;cursor:pointer;font-weight:bold}
main{padding:30px}
#videos{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px;margin-top:25px}
video{width:100%;border-radius:10px;background:#222}
.card{background:#191919;padding:12px;border-radius:12px}
#empty{text-align:center;color:#aaa;margin-top:90px}
#upload{display:none;background:#202020;padding:20px;border-radius:12px;max-width:500px;margin:20px 0}
input{display:block;width:100%;padding:12px;margin:12px 0;background:#111;color:white;border:1px solid #444;border-radius:7px}
#status{color:#aaa}
</style>
</head>
<body>
<header>
<div class="logo">SPOKEN</div>
<button onclick="showUpload()">＋ PUBLICAR VÍDEO</button>
</header>
<main>
<h1>Início</h1>
<section id="upload">
<h2>Publicar vídeo</h2>
<form id="form">
<input name="title" placeholder="Título do vídeo" maxlength="80" required>
<input name="video" type="file" accept="video/*" required>
<button type="submit">PUBLICAR</button>
</form>
<p id="status"></p>
</section>
<div id="videos"></div>
<div id="empty">🎬<h2>Ainda não há vídeos!</h2><p>Seja o primeiro a publicar no SPOKEN.</p></div>
</main>
<script>
function showUpload(){
  const area=document.getElementById("upload");
  area.style.display=area.style.display==="block"?"none":"block";
}
async function loadVideos(){
  const area=document.getElementById("videos");
  try{
    const response=await fetch("/api/videos");
    const videos=await response.json();
    area.replaceChildren();
    document.getElementById("empty").style.display=videos.length?"none":"block";
    videos.forEach(item=>{
      const card=document.createElement("div");
      card.className="card";
      const player=document.createElement("video");
      player.controls=true;
      player.preload="metadata";
      player.src=item.url;
      const title=document.createElement("h3");
      title.textContent=item.title;
      card.append(player,title);
      area.append(card);
    });
  }catch(error){
    document.getElementById("empty").textContent="Não foi possível carregar os vídeos.";
  }
}
document.getElementById("form").addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.target;
  const status=document.getElementById("status");
  const data=new FormData(form);
  status.textContent="Enviando vídeo... aguarde.";
  try{
    const response=await fetch("/api/videos",{method:"POST",body:data});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error||"Erro no envio.");
    status.textContent="Vídeo publicado com sucesso!";
    form.reset();
    await loadVideos();
  }catch(error){
    status.textContent=error.message;
  }
});
loadVideos();
</script>
</body>
</html>`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("SPOKEN online na porta " + PORT);
});
