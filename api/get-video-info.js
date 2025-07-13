// api/get-video-info.js
const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    const videoID = req.query.videoID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    console.log(`[API] Recebido pedido para o vídeo ID: ${videoID}`);

    if (!videoID) {
        return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'A chave da API do YouTube não está configurada no servidor.' });
    }

    try {
        console.log("[API] A buscar dados do vídeo e roteiro em paralelo...");
        const fetchVideoData = fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoID}&key=${apiKey}`).then(r => r.json());
        const fetchTranscriptData = YoutubeTranscript.fetchTranscript(videoID);

        const [videoDataResult, transcriptResult] = await Promise.allSettled([fetchVideoData, fetchTranscriptData]);

        let transcriptText = "[AVISO] Roteiro não encontrado ou indisponível.";
        if (transcriptResult.status === 'fulfilled' && transcriptResult.value.length > 0) {
            transcriptText = transcriptResult.value.map(item => item.text).join(' ');
            console.log("[API] Roteiro encontrado com sucesso.");
        } else {
            console.log("[API] Falha ao buscar roteiro. Status:", transcriptResult.status, "Motivo:", transcriptResult.reason);
        }

        if (videoDataResult.status === 'rejected') {
            throw new Error(videoDataResult.reason);
        }

        console.log("[API] A enviar resposta completa para o site.");
        res.status(200).json({
            videoData: videoDataResult.value,
            transcript: transcriptText
        });

    } catch (error) {
        console.error("[API] Erro critico no servidor:", error);
        res.status(500).json({ error: `Ocorreu um erro no servidor: ${error.message}` });
    }
};