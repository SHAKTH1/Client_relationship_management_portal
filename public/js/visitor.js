document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('connectForm');
    const thankYouContainer = document.getElementById('thankYouContainer');
    const overlayContainer = document.getElementById('overlayContainer');
    const phoneInput = document.getElementById('phone');
    const submitButton = form.querySelector('button[type="submit"]');
    const phoneMessage = document.createElement('div');
    phoneMessage.style.color = 'red';
    phoneInput.parentNode.insertBefore(phoneMessage, phoneInput.nextSibling);

    const faceImageInput = document.getElementById('faceImage');
    let faceImageFile = null;

    phoneInput.addEventListener('input', function() {
        const phone = phoneInput.value.trim();
        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
            phoneMessage.textContent = 'Phone number must be exactly 10 digits.';
            submitButton.disabled = true;
        } else {
            phoneMessage.textContent = '';
            submitButton.disabled = false;
        }
    });

    async function openCameraForImageCapture() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.backgroundColor = '#fff';
        container.style.zIndex = '9999';
        container.style.padding = '20px';
        container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
        container.style.maxWidth = '90%';
        container.style.maxHeight = '90%';
        container.style.overflow = 'hidden';

        document.body.appendChild(container);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            const video = document.createElement('video');
            video.style.width = '100%';
            video.style.height = 'auto';
            video.style.display = 'block';
            container.appendChild(video);
            video.srcObject = stream;
            video.play();

            const captureButton = document.createElement('button');
            captureButton.textContent = 'Capture';
            container.appendChild(captureButton);

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            container.appendChild(closeButton);

            captureButton.addEventListener('click', async () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageDataURL = canvas.toDataURL('image/jpeg');
                const blob = await dataURLtoBlob(imageDataURL);

                faceImageFile = blob;
                showImagePreview('faceImageDisplay', blob);

                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(container);
            });

            closeButton.addEventListener('click', () => {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(container);
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please upload an image instead.');
            document.body.removeChild(container);
        }
    }

    function showImagePreview(elementId, blob) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';

            const fileSize = document.createElement('span');
            fileSize.textContent = `File Size: ${(blob.size / 1024).toFixed(2)} KB`;

            const previewContainer = document.getElementById(elementId);
            previewContainer.innerHTML = '';
            previewContainer.appendChild(img);
            previewContainer.appendChild(fileSize);
        };

        reader.readAsDataURL(blob);
    }

    async function dataURLtoBlob(dataURL) {
        return new Promise((resolve) => {
            const parts = dataURL.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);

            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            resolve(new Blob([uInt8Array], { type: contentType }));
        });
    }

    document.getElementById('captureFace').addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission
        openCameraForImageCapture();
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        form.style.display = 'none';
        overlayContainer.style.display = 'none';
        thankYouContainer.style.display = 'block';

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('phone', document.getElementById('phone').value.trim());
        formData.append('email', document.getElementById('email').value.trim());
        formData.append('companyName', document.getElementById('companyName').value.trim());
        formData.append('personToMeet', document.getElementById('personToMeet').value.trim());
        formData.append('personReferred', document.getElementById('personReferred').value.trim());
        // formData.append('domain', document.getElementById('domains').value.trim());

       


        if (faceImageFile) {
            formData.append('faceImage', faceImageFile);
        }

        try {
            const response = await fetch(`/register`, {
                method: 'POST',
                body: formData
            });

            if (response.headers.get('Content-Type')?.includes('application/json')) {
                const result = await response.json();

                if (response.ok) {
                    document.getElementById('message').textContent = 'Registration successful! Thank you.';
                    setTimeout(() => {
                        location.href = 'visitor.html';
                    }, 2000);
                } else {
                    document.getElementById('message').textContent = `Error: ${result.error}`;
                }
            } else {
                console.error('Expected JSON response but received:', await response.text());
                document.getElementById('message').textContent = 'Unexpected server response. Please try again later.';
            }
        } catch (error) {
            console.error('Error during registration:', error);
            document.getElementById('message').textContent = 'Error during registration. Please try again later.';
        }
    });

    setTimeout(() => {
        overlayContainer.classList.add('transition-left');
    }, 1200);
});


const domains = ["Health Care", "Food", "Agriculture", "IT Software", "Electronics", "Government Agencies", "NGO", "Investors","Civil Infrastructure", "Future Mobility", "Fintech","Architecture", "Interior Design", "Real Estate", "Education", "Biotech", "Bio Informatics", "Electronics", "Electrical","Semiconductors", "Corprate", "MNC", "Promoters", "B2B", "Designers", "IT hardware", "Manufacturer", "Researcher", "Others", "Scientist", "Defence"];

const input = document.getElementById('domain-input');
const suggestions = document.getElementById('suggestions');

input.addEventListener('input', function() {
    const query = input.value.toLowerCase();
    suggestions.innerHTML = ''; // Clear existing suggestions

    if (query.length > 0) {
        const filteredDomains = domains.filter(domain => domain.toLowerCase().includes(query));

        if (filteredDomains.length > 0) {
            suggestions.style.display = 'block'; // Show suggestions
            filteredDomains.forEach(domain => {
                const li = document.createElement('li');
                li.textContent = domain;
                suggestions.appendChild(li);
            });
        } else {
            suggestions.style.display = 'none'; // Hide if no results
        }
    } else {
        suggestions.style.display = 'none'; // Hide when input is empty
    }
});

suggestions.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
        input.value = e.target.textContent;
        suggestions.innerHTML = ''; // Clear suggestions after selection
        suggestions.style.display = 'none'; // Hide suggestions after clicking
    }
});
