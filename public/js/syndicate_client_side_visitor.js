document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('connectForm');
    const thankYouContainer = document.getElementById('thankYouContainer');
    const overlayContainer = document.getElementById('overlayContainer');
    const phoneInput = document.getElementById('phone');
    const submitButton = form.querySelector('button[type="submit"]');
    const phoneMessage = document.createElement('div');
    phoneMessage.style.color = 'red';
    phoneInput.parentNode.insertBefore(phoneMessage, phoneInput.nextSibling);
    let faceImageFile = null;

      // Set referrer field if passed in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = urlParams.get('referrer');
      const personReferredField = document.getElementById('personReferred');
      let requiresReferral = Boolean(referrer);
      
      if (referrer) {
          personReferredField.value = referrer;
          personReferredField.disabled = true;
      } else {
          personReferredField.value = '';
      }

    // Phone number validation
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
            captureButton.style.marginTop = '10px';
            container.appendChild(captureButton);

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.marginTop = '10px';
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
            img.style.maxWidth = '150px';
            img.style.maxHeight = '150px';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.3)';
            img.style.border = '1px solid #ccc';

            const fileSize = document.createElement('span');
            fileSize.textContent = `File Size: ${(blob.size / 1024).toFixed(2)} KB`;
            fileSize.style.display = 'block';
            fileSize.style.fontSize = '0.8em';
            fileSize.style.color = '#555';

            const faceImageDisplay = document.getElementById(elementId);
            faceImageDisplay.innerHTML = '';
            faceImageDisplay.appendChild(img);
            faceImageDisplay.appendChild(fileSize);
            document.getElementById('capturedImages').style.display = 'block';
        };
        reader.readAsDataURL(blob);
    }

    async function dataURLtoBlob(dataURL) {
        const response = await fetch(dataURL);
        return await response.blob();
    }

    document.getElementById('captureFace').addEventListener('click', openCameraForImageCapture);

    document.getElementById('uploadImageButton').addEventListener('click', function() {
        document.getElementById('uploadImage').click();
    });

    document.getElementById('uploadImage').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            faceImageFile = file;
            showImagePreview('faceImageDisplay', file);
        }
    });

    setTimeout(() => {
        overlayContainer.classList.add('transition-left');
    }, 1200);

    // Capture token from local storage
    const syndicateToken = localStorage.getItem('syndicateToken');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
    
        if (requiresReferral && !personReferredField.value.trim()) {
            personReferredField.value = referrer;
        }
    
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('phone', document.getElementById('phone').value.trim());
        formData.append('email', document.getElementById('email').value.trim());
        formData.append('companyName', document.getElementById('companyName').value.trim());
        formData.append('personToMeet', document.getElementById('personToMeet').value.trim());
        formData.append('domain', document.getElementById('domain-input').value.trim());
        formData.append('personReferred', personReferredField.value.trim()); 
    
        if (faceImageFile) {
            formData.append('faceImage', faceImageFile);
        }
    
        try {
            const response = await fetch(`/api/syndicateclients/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${syndicateToken}`
                },
                body: formData
            });
    
            const result = await response.json();
    
            const messageDiv = document.getElementById('message');
            if (response.ok) {
                messageDiv.classList.remove('show');
                messageDiv.style.display = 'none';
                thankYouContainer.style.display = 'block';
                setTimeout(() => {
                    location.href = 'https://www.posspole.com/';
                }, 3000);
            } else {
                thankYouContainer.style.display = 'none';
                messageDiv.style.display = 'block';
                messageDiv.classList.add('show'); // Apply transition effect
    
                if (response.status === 400) {
                    if (result.error === 'Email already exists.') {
                        messageDiv.textContent = 'Email already exists. Please try again with another email ID.';
                    } else if (result.error === 'Phone number already exists.') {
                        messageDiv.textContent = 'Phone number already exists. Please try filling with an alternate phone number.';
                    } else {
                        messageDiv.textContent = `Error: ${result.error}`;
                    }
                } else if (response.status === 500) {
                    messageDiv.textContent = 'Internal server error. Please try again later.';
                }
            }
        } catch (error) {
            console.error('Error during registration:', error);
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = 'Error during registration. Please try again later.';
            messageDiv.style.display = 'block';
            messageDiv.classList.add('show'); // Apply transition effect
            thankYouContainer.style.display = 'none';
        }
    });
    

    async function fetchSyndicateNames() {
        try {
            const response = await fetch('/api/syndicates');
            if (response.ok) {
                const syndicates = await response.json();
                populateSyndicateDropdown(syndicates);
            } else {
                console.error('Error fetching syndicate names');
            }
        } catch (error) {
            console.error('Error fetching syndicate names:', error);
        }
    }

    function populateSyndicateDropdown(syndicates) {
        personReferredField.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'I am referred by?';
        personReferredField.appendChild(defaultOption);

        syndicates.forEach(syndicate => {
            const option = document.createElement('option');
            option.value = syndicate.syndicate_name;
            option.textContent = syndicate.syndicate_name;
            personReferredField.appendChild(option);
        });
    }

    fetchSyndicateNames();
});

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const referrer = urlParams.get('referrer'); // Get the referrer from URL

    if (referrer) {
        const personReferredField = document.getElementById('personReferred');
        personReferredField.value = referrer; // Automatically fill with referrer
        personReferredField.disabled = true;  // Disable editing
    }

    const form = document.getElementById('connectForm');
    // Other form-related code remains unchanged
});


const domains = [
    { name: "Health Care", popularity: 90 },
    { name: "Food", popularity: 85 },
    { name: "Agriculture", popularity: 70 },
    { name: "IT Software", popularity: 95 },
    { name: "Electronics", popularity: 75 },
    { name: "Government Agencies", popularity: 60 },
    { name: "NGO", popularity: 65 },
    { name: "Investors", popularity: 80 },
    { name: "Civil Infrastructure", popularity: 68 },
    { name: "Future Mobility", popularity: 72 },
    { name: "Fintech", popularity: 90 },
    { name: "Architecture", popularity: 78 },
    { name: "Interior Design", popularity: 74 },
    { name: "Real Estate", popularity: 83 },
    { name: "Education", popularity: 88 },
    { name: "Biotech", popularity: 85 },
    { name: "Bio Informatics", popularity: 67 },
    { name: "Electrical", popularity: 76 },
    { name: "Semiconductors", popularity: 80 },
    { name: "Corporate", popularity: 82 },
    { name: "MNC", popularity: 77 },
    { name: "Promoters", popularity: 58 },
    { name: "B2B", popularity: 79 },
    { name: "Designers", popularity: 68 },
    { name: "IT Hardware", popularity: 75 },
    { name: "Manufacturer", popularity: 66 },
    { name: "Researcher", popularity: 85 },
    { name: "Others", popularity: 50 },
    { name: "Scientist", popularity: 70 },
    { name: "Defence", popularity: 78 },
    { name: "Energy", popularity: 84 },
    { name: "Telecommunications", popularity: 81 },
    { name: "Retail", popularity: 87 },
    { name: "Banking", popularity: 93 },
    { name: "E-commerce", popularity: 88 },
    { name: "Marketing", popularity: 82 },
    { name: "Logistics", popularity: 76 },
    { name: "Aerospace", popularity: 75 },
    { name: "Automotive", popularity: 83 },
    { name: "Healthcare IT", popularity: 89 },
    { name: "Pharmaceuticals", popularity: 90 },
    { name: "Cybersecurity", popularity: 91 },
    { name: "Data Analytics", popularity: 92 },
    { name: "Machine Learning", popularity: 94 },
    { name: "AI & Robotics", popularity: 96 },
    { name: "Climate Tech", popularity: 82 },
    { name: "Blockchain", popularity: 88 },
    { name: "Smart Cities", popularity: 74 },
    { name: "SaaS", popularity: 85 },
    { name: "Insurance", popularity: 81 },
    { name: "Investment Banking", popularity: 87 },
    { name: "Capital Markets", popularity: 78 },
    { name: "Venture Capital", popularity: 83 },
    { name: "Environmental", popularity: 73 },
    { name: "Public Relations", popularity: 70 },
    { name: "Hospitality", popularity: 72 },
    { name: "Entertainment", popularity: 76 },
    { name: "Media & Journalism", popularity: 78 },
    { name: "Consumer Goods", popularity: 79 },
    { name: "Textile", popularity: 68 },
    { name: "Legal", popularity: 69 },
    { name: "Human Resources", popularity: 67 },
    { name: "Renewable Energy", popularity: 82 },
    { name: "Mining", popularity: 65 },
    { name: "Chemical Industry", popularity: 66 },
    { name: "Apparel & Fashion", popularity: 73 },
    { name: "Social Services", popularity: 60 },
    { name: "Transportation", popularity: 80 },
    { name: "Maritime", popularity: 59 },
    { name: "Photography", popularity: 55 },
    { name: "Construction", popularity: 71 },
    { name: "Waste Management", popularity: 63 },
    { name: "Animal Health", popularity: 61 },
    { name: "Luxury Goods", popularity: 69 },
    { name: "Tourism", popularity: 64 },
    { name: "Oceanography", popularity: 62 },
    { name: "Nanotechnology", popularity: 75 },
    { name: "Personal Finance", popularity: 72 },
    { name: "Behavioral Science", popularity: 68 },
    { name: "Human Rights", popularity: 66 },
    { name: "Urban Development", popularity: 77 },
    { name: "Renewable Resources", popularity: 74 },
    { name: "Drone Technology", popularity: 70 },
    { name: "Augmented Reality", popularity: 83 },
    { name: "Virtual Reality", popularity: 84 },
    { name: "Gaming", popularity: 85 },
    { name: "Event Management", popularity: 65 },
    { name: "Pension Funds", popularity: 62 },
    { name: "Agritech", popularity: 71 },
    { name: "Health Informatics", popularity: 80 },
    { name: "Ocean Conservation", popularity: 58 },
    { name: "Culinary Arts", popularity: 60 },
    { name: "Consumer Electronics", popularity: 81 },
    { name: "Digital Marketing", popularity: 83 },
    { name: "Product Development", popularity: 79 },
    { name: "Sustainable Development", popularity: 82 },
    { name: "Home Automation", popularity: 76 },
    { name: "Agronomy", popularity: 64 },
    { name: "Biometrics", popularity: 68 },
    { name: "Material Science", popularity: 78 },
    { name: "Petroleum Engineering", popularity: 66 },
    { name: "Music Production", popularity: 72 },
    { name: "Veterinary Sciences", popularity: 67 },
    { name: "Clinical Trials", popularity: 73 },
    { name: "Public Policy", popularity: 69 },
    { name: "Optics & Photonics", popularity: 62 },
    { name: "Home Security", popularity: 63 },
    { name: "Forestry", popularity: 60 },
    { name: "Speech Recognition", popularity: 76 },
    { name: "Smart Manufacturing", popularity: 79 },
    { name: "Genetics", popularity: 81 },
    { name: "Hydrology", popularity: 64 },
    { name: "Microbiology", popularity: 69 },
    { name: "Neurology", popularity: 75 },
    { name: "Renewable Infrastructure", popularity: 77 },
    { name: "Hydrogen Technology", popularity: 78 },
    { name: "Biofuel", popularity: 70 },
    { name: "Sports Science", popularity: 71 },
    { name: "Telemedicine", popularity: 82 },
    { name: "Telecommunications Equipment", popularity: 73 },
    { name: "Child Welfare", popularity: 59 },
    { name: "Behavioral Analytics", popularity: 72 }
    ];
    
    const domainSet = new Set(domains.map(domain => domain.name)); // For validation
    
    const input = document.getElementById('domain-input');
    const suggestions = document.getElementById('suggestions');
    const customDomainInput = document.getElementById('custom-domain');
    const errorMessage = document.getElementById('error-message');
    
    // Function to display suggestions
    function displaySuggestions(list) {
    suggestions.innerHTML = '';
    list.forEach(domain => {
      const li = document.createElement('li');
      li.textContent = domain.name;
      li.style.padding = "10px";
      li.style.cursor = "pointer";
      suggestions.appendChild(li);
    });
    suggestions.style.display = 'block';
    }
    
    // Fuzzy matching for suggestions
    function fuzzyMatch(query) {
    const lowercaseQuery = query.toLowerCase();
    return domains
      .filter(domain => domain.name.toLowerCase().includes(lowercaseQuery))
      .sort((a, b) => b.popularity - a.popularity);
    }
    
    // Debounce to handle excessive calls
    function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
    }
    
    // Display suggestions on input
    input.addEventListener('input', debounce(function() {
    const query = input.value.toLowerCase();
    if (query) {
      const filteredDomains = fuzzyMatch(query);
      if (filteredDomains.length > 0) {
          displaySuggestions(filteredDomains);
      } else {
          suggestions.style.display = 'none';
      }
    } else {
      displaySuggestions(domains.slice(0, 10)); // Show top suggestions
    }
    errorMessage.style.display = 'none';
    customDomainInput.style.display = 'none'; // Hide custom input if typing something else
    }, 300));
    
    // Handle suggestion click
    suggestions.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
      input.value = e.target.textContent;
      suggestions.style.display = 'none';
    
      if (e.target.textContent === "Others") {
          customDomainInput.style.display = 'block'; // Show custom input if "Others" is selected
          customDomainInput.focus();
      } else {
          customDomainInput.style.display = 'none';
      }
      errorMessage.style.display = 'none';
    }
    });
    
    // Validate input on blur
    input.addEventListener('blur', function() {
    const userInput = input.value.trim();
    if (userInput === "Others") {
      // Ensure custom domain input is shown and not empty for "Others" selection
      if (customDomainInput.value.trim() === "") {
          errorMessage.textContent = "Please specify your domain.";
          errorMessage.style.display = 'block';
      }
    } else if (userInput && !domainSet.has(userInput)) {
      errorMessage.textContent = "Please select a valid domain from the list.";
      errorMessage.style.display = 'block';
      input.value = ''; // Clear invalid input
    }
    });

     
document.addEventListener('DOMContentLoaded', function() {
    // Trigger the hidden file input when the "Upload Image" button is clicked
    document.getElementById('uploadImageButton').addEventListener('click', function() {
        document.getElementById('uploadImage').click(); // Trigger the hidden file input
    });
  
    // Event listener for when a file is selected
    document.getElementById('uploadImage').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Display the uploaded image in the image container
                const imageDisplay = document.getElementById('faceImageDisplay');
                imageDisplay.innerHTML = `<img src="${e.target.result}" alt="Uploaded Image">`;
                imageDisplay.style.display = 'flex'; 
            };
            reader.readAsDataURL(file); // Read the file as a Data URL for preview
        }
    });
  });

 
