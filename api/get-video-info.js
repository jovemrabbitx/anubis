// api/get-video-info.js - O nosso único e poderoso backend
const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    const videoID = req.query.videoID;
    // A chave agora é lida de forma segura das variáveis de ambiente da Vercel
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!videoID) {
        return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'A chave da API do YouTube não está configurada no servidor.' });
    }

    try {
        // Vamos preparar as duas buscas: pelos dados e pelo roteiro.
        const fetchVideoData = fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoID}&key=${apiKey}`).then(r => r.json());
        const fetchTranscriptData = YoutubeTranscript.fetchTranscript(videoID);

        // Usamos Promise.allSettled para executar as duas ao mesmo tempo e continuar mesmo que uma falhe.
        const [videoDataResult, transcriptResult] = await Promise.allSettled([fetchVideoData, fetchTranscriptData]);

        // Verificamos o resultado da busca de dados
        if (videoDataResult.status === 'rejected' || videoDataResult.value.error) {
            throw new Error(videoDataResult.reason || videoDataResult.value.error.message);
        }

        // Verificamos o resultado da busca de roteiro
        let transcriptText = "[AVISO] Roteiro não encontrado ou indisponível.";
        if (transcriptResult.status === 'fulfilled' && transcriptResult.value.length > 0) {
            transcriptText = transcriptResult.value.map(item => item.text).join(' ');
        }

        // Enviamos uma única resposta com tudo junto para o nosso site!
        res.status(200).json({
            videoData: videoDataResult.value,
            transcript: transcriptText
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: `Ocorreu um erro no servidor: ${error.message}` });
    }
};