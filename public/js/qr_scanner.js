document.addEventListener('DOMContentLoaded', () => {


    const clientDetails = {
        id: null,
        name: '',
        phone: '',
        email: '',
        company: '',
        photoId: null
    };
    let currentCamera = "environment";

    // Initialize the QR code reader
    const qrCodeScanner = new Html5Qrcode("qr-reader");
    startQrScanner();

    function startQrScanner() {
        qrCodeScanner.start(
            { facingMode: currentCamera },
            {
                fps: 10,
                qrbox: 250
            },
            onScanSuccess,
            // onScanFailure
        ).catch(err => {
            console.error(`Failed to start QR code scanner: ${err}`);
            alert('Unable to access camera. Please check browser permissions.');
        });
    }

    // Flip Camera
    document.getElementById('flip-camera-btn').addEventListener('click', () => {
        currentCamera = currentCamera === "environment" ? "user" : "environment";
        qrCodeScanner.stop().then(() => {
            startQrScanner();
        }).catch(err => console.error('Error stopping QR scanner:', err));
    });

    // Handle Tab Switching
    document.getElementById('qr-tab').addEventListener('click', () => {
        document.getElementById('scanner-section').classList.remove('hidden-section');
        document.getElementById('history-section').classList.add('hidden-section');
    });

    document.getElementById('history-tab').addEventListener('click', () => {
        document.getElementById('scanner-section').classList.add('hidden-section');
        document.getElementById('history-section').classList.remove('hidden-section');
        fetchHistory(); // Fetch history when switching to the history tab
    });

    // Fetch and display visit history
    function fetchHistory() {
        fetch('/api/visit-history')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayHistory(data.visits);
                } else {
                    document.getElementById('history-list').innerHTML = '<p>Failed to load history.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching visit history:', error);
                document.getElementById('history-list').innerHTML = '<p>Error fetching history.</p>';
            });
    }

    function displayHistory(visits) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
    
        const historySections = {
            today: [],
            yesterday: [],
            thisWeek: [],
            thisMonth: []
        };
    
        // Categorize visits
        visits.forEach(visit => {
            if (!visit.clientId || !visit.checkInTime) return;
    
            const visitDate = new Date(visit.checkInTime);
    
            if (isSameDate(visitDate, today)) {
                historySections.today.push(visit);
            } else if (isSameDate(visitDate, yesterday)) {
                historySections.yesterday.push(visit);
            } else if (isSameWeek(visitDate, today)) {
                historySections.thisWeek.push(visit);
            } else if (visitDate.getMonth() === today.getMonth() && visitDate.getFullYear() === today.getFullYear()) {
                historySections.thisMonth.push(visit);
            }
        });
    
        // Render history sections
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
    
        Object.keys(historySections).forEach(section => {
            if (historySections[section].length > 0) {
                historyList.innerHTML += `<h3 class="text-xl mt-4">${capitalizeFirstLetter(section)}</h3>`;
                historySections[section].forEach(visit => {
                    if (visit.clientId && visit.clientId.name) {
                        historyList.innerHTML += `
                        <div class="border p-2 mt-2">
                            <p><strong>Name:</strong> ${visit.clientId.name}</p>
                            <p><strong>Phone:</strong> ${visit.clientId.phone}</p>
                            <p><strong>Email:</strong> ${visit.clientId.email}</p>
                            <p><strong>Check-in:</strong> ${new Date(visit.checkInTime).toLocaleString()}</p>
                            <p><strong>Check-out:</strong> ${visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleString() : 'N/A'}</p>
                            <p><strong>Here to meet:</strong> ${visit.hereToMeet}</p>
                            <p><strong>Agenda:</strong> ${visit.agenda}</p>
                            <p><strong>Person Referred:</strong> ${visit.personReferred || 'N/A'}</p>
                        </div>
                    `;
                    }
                });
            }
        });
    }
    
    // Utility functions
    function isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    function isSameWeek(date1, today) {
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        const lastDayOfWeek = new Date(today);
        lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));

        return date1 >= firstDayOfWeek && date1 <= lastDayOfWeek;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Existing functions (onScanSuccess, handleCheckInOut, etc.) remain unchanged

    function onScanSuccess(qrCodeMessage) {
        console.log('QR Code Scanned:', qrCodeMessage);
        const urlParams = new URLSearchParams(qrCodeMessage.split('?')[1]);
        const clientId = urlParams.get('client_id');
    
        if (clientId) {
            fetch(`/api/client/public/${clientId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Client found:', data.client); // Debugging line
                        clientDetails.id = clientId;
                        clientDetails.name = data.client.name;
                        clientDetails.phone = data.client.phone;
                        clientDetails.email = data.client.email;
                        clientDetails.company = data.client.companyName;
                        clientDetails.photoId = data.client.faceImage;
    
                        document.getElementById('client-name').textContent = `Name: ${clientDetails.name}`;
                        document.getElementById('client-phone').textContent = `Phone: ${clientDetails.phone}`;
                        document.getElementById('client-email').textContent = `Email: ${clientDetails.email}`;
                        document.getElementById('client-company').textContent = `Company: ${clientDetails.company}`;
    
                        if (clientDetails.photoId) {
                            document.getElementById('client-photo').src = `/images/${clientDetails.photoId}`;
                            document.getElementById('client-photo').style.display = 'block';
                        }
                        document.getElementById('additional-fields').style.display = 'block'; // Show additional fields
                        document.getElementById('check-in-btn').style.display = 'block';
                        document.getElementById('check-out-btn').style.display = 'block';
                    } else {
                        console.warn('Client not found!'); // Debugging line
                        alert('Client not found!');
                    }
                })
                .catch(error => {
                    console.error('Error fetching client data:', error);
                    alert('Error fetching client data.');
                });
        } else {
            console.warn('Invalid QR Code format'); // Debugging line
            alert('Invalid QR Code!');
        }
    }
    

    // function onScanFailure(error) {
    //     console.error(`QR Code scan failed: ${error}`);
    // }

    // Handle Check In button click
    document.getElementById('check-in-btn').addEventListener('click', () => {
        handleCheckInOut('checkin');
    });

    // Handle Check Out button click
    document.getElementById('check-out-btn').addEventListener('click', () => {
        handleCheckInOut('checkout');
    });

    function handleCheckInOut(action) {
        if (clientDetails.id) {
            if (action === 'checkin') {
                const hereToMeet = document.getElementById('here-to-meet').value.trim();
                const agenda = document.getElementById('agenda').value.trim();
    
                if (!hereToMeet || !agenda) {
                    alert('Please enter "Here to meet" and "Agenda" before checking in.');
                    return;
                }
    
                fetch(`/api/client/${clientDetails.id}/${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        timestamp: new Date(),
                        hereToMeet,
                        agenda
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(`${action === 'checkin' ? 'Check In' : 'Check Out'} successful!`);
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error(`Error during ${action}:`, error);
                    alert(`Error during ${action}. Please try again.`);
                });
            } else {
                // Check-out logic
                fetch(`/api/client/${clientDetails.id}/${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ timestamp: new Date() })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Check Out successful!');
                    } else {
                        alert(data.message);
                    }
                })
                .catch(error => {
                    console.error('Error during check-out:', error);
                    alert('Error during check-out. Please try again.');
                });
            }
        }
    }
    
    
});

document.addEventListener('DOMContentLoaded', () => {
    const overlayContainer = document.getElementById('overlayContainer');
    const scannerSection = document.getElementById('scanner-section');
    const visitorRedirect = document.getElementById('visitorRedirect');

    // Handle the overlay transition and show the scanner
    visitorRedirect.addEventListener('click', () => {
        setTimeout(() => {
            overlayContainer.classList.add('transition-left');
            // After transition, hide overlay and show scanner
            setTimeout(() => {
                overlayContainer.style.display = 'none';
                scannerSection.classList.remove('hidden-section');
            }, 1000); // Matches the CSS transition duration of 1 second
        }, 1200);
    });
});