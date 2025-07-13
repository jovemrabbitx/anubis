// api/get-video-info.js - Versão com Navegador Robô (Puppeteer)
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

// Função para buscar a transcrição usando o navegador robô
async function fetchTranscriptWithPuppeteer(videoID) {
    let browser = null;
    try {
        // Inicia o navegador robô
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Navega para a página do vídeo
        await page.goto(`https://www.youtube.com/watch?v=$${videoID}`, { waitUntil: 'domcontentloaded' });

        // Espera e clica no botão de "..." para abrir o menu
        await page.waitForSelector('#button-shape button[aria-label="More actions"]', { timeout: 5000 });
        await page.click('#button-shape button[aria-label="More actions"]');

        // Espera e clica no item de menu "Show transcript"
        await page.waitForSelector('ytd-menu-service-item-renderer.style-scope:nth-child(2) > yt-formatted-string', { timeout: 5000 });
        await page.click('ytd-menu-service-item-renderer.style-scope:nth-child(2) > yt-formatted-string');
        
        // Espera que os segmentos da transcrição carreguem
        await page.waitForSelector('ytd-transcript-segment-renderer.style-scope yt-formatted-string', { timeout: 5000 });
        
        // Extrai o texto de todos os segmentos
        const segments = await page.$$eval('ytd-transcript-segment-renderer.style-scope yt-formatted-string', 
            nodes => nodes.map(n => n.textContent.trim()).join(' ')
        );

        return segments;

    } catch (error) {
        console.error(`[Puppeteer] Erro ao buscar roteiro para ${videoID}:`, error.message);
        // Retorna uma mensagem de erro clara se algo falhar
        return "[AVISO] Não foi possível extrair o roteiro. O vídeo pode não ter uma transcrição, ou o layout do YouTube pode ter mudado.";
    } finally {
        // Fecha o navegador para libertar recursos
        if (browser !== null) {
            await browser.close();
        }
    }
}


// Função principal do nosso serviço
module.exports = async (req, res) => {
    const videoID = req.query.videoID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!videoID) return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
    if (!apiKey) return res.status(500).json({ error: 'A chave da API do YouTube não está configurada.' });

    try {
        // Buscamos os dados e o roteiro em paralelo
        const [videoDataResult, transcriptResult] = await Promise.allSettled([
            fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoID}&key=${apiKey}`).then(r => r.json()),
            fetchTranscriptWithPuppeteer(videoID)
        ]);

        if (videoDataResult.status === 'rejected') throw new Error('Falha ao buscar dados do vídeo.');
        
        // Enviamos tudo de volta para o nosso site
        res.status(200).json({
            videoData: videoDataResult.value,
            transcript: transcriptResult.status === 'fulfilled' ? transcriptResult.value : "[ERRO] Falha inesperada no robô de transcrição."
        });

    } catch (error) {
        res.status(500).json({ error: `Ocorreu um erro no servidor: ${error.message}` });
    }
};