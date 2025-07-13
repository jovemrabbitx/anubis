// api/get-video-info.js - Versão 2.0: Priorizando transcrição em Português
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
        // Buscamos os dados do vídeo primeiro (título, capa, etc.)
        const videoDataResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoID}&key=${apiKey}`);
        if (!videoDataResponse.ok) {
            const errorData = await videoDataResponse.json();
            console.error('Erro na API do YouTube:', errorData);
            throw new Error('Falha ao buscar dados do vídeo na API do YouTube.');
        }
        const videoData = await videoDataResponse.json();

        let transcriptText;
        try {
            // ================== ALTERAÇÃO PRINCIPAL AQUI ==================
            // Instruímos a biblioteca a priorizar a transcrição em português ('pt').
            // Se não houver 'pt', ela buscará a padrão (geralmente 'en' ou a original).
            const transcript = await YoutubeTranscript.fetchTranscript(videoID, { lang: 'pt' });
            // =============================================================

            transcriptText = transcript.map(item => item.text).join(' ');
        } catch (error) {
            // Se falhar mesmo com a priorização, informamos o usuário.
            console.log(`Não foi possível buscar a transcrição para o vídeo ${videoID} (mesmo com lang: 'pt'):`, error.message);
            transcriptText = "[AVISO] Não foi possível extrair o roteiro para este vídeo. O criador pode ter desativado as legendas/transcrições automáticas.";
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