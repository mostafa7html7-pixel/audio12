const { FFmpeg } = window.FFmpegWASM;
const { fetchFile, toBlobURL } = window.FFmpegUtil;

let ffmpeg = null;

const convertBtn = document.getElementById('convert-btn');
const uploader = document.getElementById('uploader');
const status = document.getElementById('status');
const resultDiv = document.getElementById('result');
const downloadLink = document.getElementById('download-link');

// 1. تحميل المكتبة عند فتح الصفحة
async function loadFFmpeg() {
    ffmpeg = new FFmpeg();
    status.innerText = "جاري تحميل محرك المعالجة (FFmpeg)...";
    
    await ffmpeg.load({
        coreURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL('https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', 'application/wasm'),
    });
    
    status.innerText = "المحرك جاهز للاستخدام ✅";
}

loadFFmpeg();

// 2. معالجة التحويل
convertBtn.onclick = async () => {
    const file = uploader.files[0];
    if (!file) return alert("يرجى اختيار ملف أولاً!");

    const format = document.getElementById('format').value;
    convertBtn.disabled = true;
    status.innerText = "جاري التحويل... قد يستغرق ذلك وقتاً حسب حجم الملف";

    const inputName = 'input_file';
    const outputName = `output_file.${format}`;

    // رفع الملف لذاكرة المتصفح
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // تنفيذ أمر التحويل
    await ffmpeg.exec(['-i', inputName, outputName]);

    // قراءة الملف الناتج
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: format === 'mp3' ? 'audio/mp3' : 'video/mp4' });

    // عرض رابط التحميل
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = outputName;
    
    resultDiv.style.display = 'block';
    status.innerText = "تم التحويل بنجاح!";
    convertBtn.disabled = false;
};