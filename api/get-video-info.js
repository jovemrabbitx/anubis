// api/get-video-info.js - Versão final, leve e inteligente
const { YoutubeTranscript } = require('youtube-transcript');

// Função principal do nosso serviço
module.exports = async (req, res) => {
    const videoID = req.query.videoID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!videoID) {
        return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'A chave da API do YouTube não está configurada no servidor.' });
    }

    try {
        // Buscamos os dados do vídeo primeiro
        const videoDataResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoID}&key=${apiKey}`);
        if (!videoDataResponse.ok) {
            throw new Error('Falha ao buscar dados do vídeo na API do YouTube.');
        }
        const videoData = await videoDataResponse.json();

        let transcriptText;
        try {
            // Tentamos buscar a transcrição. A biblioteca vai procurar pela melhor disponível.
            const transcript = await YoutubeTranscript.fetchTranscript(videoID);
            transcriptText = transcript.map(item => item.text).join(' ');
        } catch (error) {
            // Se falhar, definimos a mensagem de aviso.
            console.log(`Não foi possível buscar a transcrição para o vídeo ${videoID}:`, error.message);
            transcriptText = "[AVISO] Não foi possível extrair o roteiro para este vídeo. Verifique se as legendas estão disponíveis.";
        }

        // Enviamos uma única resposta com tudo junto para o nosso site!
        res.status(200).json({
            videoData: videoData,
            transcript: transcriptText
        });

    } catch (error) {
        console.error(`Erro crítico no servidor para o vídeo ${videoID}:`, error.message);
        res.status(500).json({ error: `Ocorreu um erro no servidor: ${error.message}` });
    }
};