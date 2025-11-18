//251 -> 180 linhas
const { jsPDF } = window.jspdf; 

document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('imageUpload');
    const imageToCrop = document.getElementById('imageToCrop');
    const cropButton = document.getElementById('cropButton');
    const savePdfButton = document.getElementById('savePdfButton');
    const printButton = document.getElementById('printButton');
    const myDialog = document.getElementById('myDialog');

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const processedContainer = document.getElementById('processedImageContainer');
    const doc_name = (new Date).toISOString().replace(/[:.]/g, '-')

    let cropper;
    let croppedBase64;
    let finalCanvasBase64;

    const showStep = (element) => element.classList.remove('hidden');
    const hiddenStep = (element) => element.classList.add('hidden');

    const clear = () => uploadInput.value = '';
    clear();

    const reloadPage = () => setTimeout(()=> location.reload(), 1000);

    const showInfo = (msg) => {
        document.getElementById('data-text').innerText = '';
        document.getElementById('data-text').innerText = msg;

        myDialog.showModal()

        setTimeout(()=>myDialog.close(), 2000)
    }

    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            imageToCrop.src = event.target.result;
            imageToCrop.style.display = 'block';

            if (cropper) cropper.destroy();
            
            cropper = new Cropper(imageToCrop, {
                aspectRatio: NaN,
                viewMode: 1,
                autoCropArea: 0.9 
            });

            hiddenStep(step1);
            showStep(step2);
        };

        reader.readAsDataURL(file);
        cropButton.click();
    });

    cropButton.addEventListener('click', () => {
        if (!cropper) return;

        croppedBase64 = cropper.getCroppedCanvas().toDataURL('image/jpeg');
        
        if (cropper) cropper.destroy();
        imageToCrop.src = croppedBase64;
        
        hiddenStep(step2);
        showStep(step3);
        step2.querySelector('button').disabled = true;

        processImage();
    });
    
    const processImage = () => {
        if (!croppedBase64) {
            showInfo('Por favor, complete o Passo 2: Recorte a imagem primeiro.');
            return;
        }

        const img = new Image();
        img.onload = function() {
            const finalWidth = 900; 
            const finalHeight = finalWidth / 1.5;

            const canvas = document.createElement('canvas');
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, finalWidth, finalHeight);
            
            const margin = 20;
            const innerWidth = (finalWidth - 3 * margin) / 2;
            const innerHeight = finalHeight - 2 * margin;

            ctx.drawImage(img, margin, margin, innerWidth, innerHeight);

            const secondX = margin + innerWidth + margin;
            ctx.drawImage(img, secondX, margin, innerWidth, innerHeight);
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(finalWidth / 2, 0);
            ctx.lineTo(finalWidth / 2, finalHeight);
            ctx.stroke();

            finalCanvasBase64 = canvas.toDataURL('image/jpeg', 0.9);

            const previewImg = document.createElement('img');
            previewImg.src = finalCanvasBase64;
            previewImg.className = 'w-full mb-4';
            processedContainer.appendChild(previewImg);
            processedContainer.classList.remove('hidden');
            
            step3.querySelector('button').disabled = true;
        };

        img.src = croppedBase64;
    }

    savePdfButton.addEventListener('click', () => {
        if (!finalCanvasBase64) {
            showInfo('Favor processar o layout da imagem primeiro!');
            return;
        }

        const doc = new jsPDF({
            orientation: 'l',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = doc.internal.pageSize.getWidth(); // ~297 mm
        const pdfHeight = doc.internal.pageSize.getHeight(); // ~210 mm
        
        const margin = 5;
        const imgWidth = pdfWidth - (2 * margin);
        const imgHeight = imgWidth / 1.5;

        const yPos = (pdfHeight - imgHeight) / 2;

        doc.addImage(finalCanvasBase64, 'JPEG', margin, yPos, imgWidth, imgHeight);

        showInfo('PDF gerado com sucesso!');

        doc.save(`doc-${doc_name}.pdf`);

        reloadPage();
    });

    printButton.addEventListener('click', () =>{
        if (!finalCanvasBase64) {
            showInfo('Erro: O layout final da imagem não foi processado.');
            return;
        }
        
        const printWindow = window.open();
        
        printWindow.document.write('<html><head><title>Imprimir Imagem</title></head><body>');
        printWindow.document.write('<img src="' + finalCanvasBase64 + '" style="max-width: 100%; height: auto;">');
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            showInfo('O documento impresso com sucesso!');

            reloadPage();
        };
    });
});