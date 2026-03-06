const { createFFmpeg, fetchFile } = FFmpeg;

// تعريف المحرك مع روابط مستقرة
const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

const uploader = document.getElementById('uploader');
const fileLabel = document.getElementById('file-label');
const fileNameSpan = document.getElementById('file-name');
const videoPreview = document.getElementById('video-preview');

// دالة لتحديث الواجهة باسم الملف
const updateFileName = (file) => {
    if (file) {
        fileNameSpan.innerText = file.name;
        fileLabel.classList.add('file-selected');
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        convert(); // بدء التحويل تلقائياً
    } else {
        fileNameSpan.innerText = 'اسحب الفيديو إلى هنا أو انقر للاختيار';
        fileLabel.classList.remove('file-selected');
        videoPreview.src = '';
    }
};

uploader.onchange = (e) => updateFileName(e.target.files[0]);

// إضافة ميزة السحب والإفلات
fileLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileLabel.classList.add('dragover');
});

fileLabel.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileLabel.classList.remove('dragover');
});

fileLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileLabel.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploader.files = files;
        updateFileName(files[0]);
    }
});

const convert = async () => {
    const file = document.getElementById('uploader').files[0];
    if (!file) return alert("اختر ملفاً أولاً");

    const status = document.getElementById('status');
    const progBar = document.getElementById('progress-bar');
    const percentText = document.getElementById('percentage');
    const resultDiv = document.getElementById('result');
    const successMessage = resultDiv.querySelector('.success-message');

    try {
        resultDiv.style.display = 'none';

        document.getElementById('progress-container').style.display = 'flex';
        progBar.style.width = '0%';
        percentText.innerText = '0%';
        status.innerText = "جاري تهيئة المحرك...";

        // مراقبة التقدم
        ffmpeg.setProgress(({ ratio }) => {
            const p = Math.round(ratio * 100);
            progBar.style.width = p + '%';
            percentText.innerText = p + '%';
        });

        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        status.innerText = "جاري المعالجة... لا تغلق الصفحة";
        
        // تم التعديل ليقوم بالتحويل إلى صوت MP3 دائماً
        const outputName = 'output.mp3';
        const type = 'audio/mp3';
        
        // الحصول على الجودة المختارة من قبل المستخدم
        const bitrate = document.getElementById('bitrate').value;

        // تحويل أي ملف (فيديو أو صوت) إلى صوت MP3
        const extension = file.name.split('.').pop();
        const inputWithExt = `input_file.${extension}`;

        ffmpeg.FS('writeFile', inputWithExt, await fetchFile(file));

        // -i: الملف المدخل
        // -vn: تجاهل الفيديو (استخراج الصوت فقط)
        // -ab 192k: تحديد جودة الصوت (audio bitrate)
        await ffmpeg.run('-i', inputWithExt, '-vn', '-ab', bitrate, outputName);

        // قراءة النتيجة
        const data = ffmpeg.FS('readFile', outputName);
        const blob = new Blob([data.buffer], { type: type });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.getElementById('download-link');
        downloadLink.href = url;
        downloadLink.download = `Abqarieno_${outputName}`;
        
        const audioResult = document.getElementById('audio-result');
        audioResult.src = url;
        resultDiv.style.display = 'flex';
        document.getElementById('progress-container').style.display = 'none';
    } catch (error) {
        console.error(error);
        status.innerText = `حدث خطأ: ${error.message || 'يرجى التحقق من الملف أو إعدادات التحويل.'}`;
        document.getElementById('progress-container').style.display = 'none';
    } finally {
        // لا يوجد زر لإعادة تفعيله، العملية تتم تلقائياً
    }
};