document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const leadId = urlParams.get('leadId') || localStorage.getItem('leadId');

    if (leadId) {
        await fetchLeadDetails(leadId);
        await fetchMoMs(leadId); // Fetch MoMs when the page loads
    } else {
        console.error('Lead ID not found in URL or local storage.');
    }
});

async function fetchLeadDetails(leadId) {
    try {
        const response = await fetch(`/api/visitors/${leadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const lead = await response.json();
            displayLeadDetails(lead);
        } else {
            console.error('Error fetching lead details:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching lead details:', error);
    }
}

function displayLeadDetails(lead) {
    const userInfoCard = document.querySelector('.bg-gray-900.p-4.rounded-md.mb-6');
    const faceImageUrl = lead.faceImage ? `/images/${lead.faceImage}` : 'https://via.placeholder.com/80';

    userInfoCard.innerHTML = `
        <div class="flex items-center">
            <img src="${faceImageUrl}" alt="Profile" class="w-16 h-16 rounded-full">
            <div class="ml-4">
                <p>Name: ${lead.name}</p>
                <p>Email: ${lead.email}</p>
                <p>Domain: ${lead.domain || 'N/A'}</p>
                <p>Phone: ${lead.phone}</p>
            </div>
        </div>
    `;
}

// Function to handle form submission for creating a new MoM
document.getElementById('momForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const leadId = localStorage.getItem('leadId');
    const heading = document.getElementById('heading').value;
    const summary = document.getElementById('summary').value;
    const dateTime = document.getElementById('dateTime').value;
    const attachments = document.getElementById('attachments').files;

    const formData = new FormData();
    formData.append('clientId', leadId);
    formData.append('heading', heading);
    formData.append('summary', summary);
    formData.append('dateTime', dateTime);
    for (let i = 0; i < attachments.length; i++) {
        formData.append('attachments', attachments[i]);
    }

    try {
        const response = await fetch('/api/mom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error creating MoM');
        }

        alert('MoM created successfully');
        fetchMoMs(leadId); // Refresh the MoMs after creating one
        resetMoMForm(); // Reset the form after submission
        closeMoMModal(); // Close the modal after submission
    } catch (error) {
        console.error('Error submitting MoM:', error);
    }
});

// Fetch and display all MoMs for the current lead
async function fetchMoMs(leadId) {
    try {
        const response = await fetch(`/api/mom/${leadId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const moms = await response.json();
            displayMoMs(moms);
        } else {
            console.error('Error fetching MoMs:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching MoMs:', error);
    }
}

// Display MoMs in the table with a "View" button for each
function displayMoMs(moms) {
    const momTable = document.getElementById('momTable');
    momTable.innerHTML = '';

    moms.forEach((mom, index) => {
        let attachmentsHTML = '';
        if (mom.attachments && mom.attachments.length > 0) {
            attachmentsHTML = mom.attachments.map(att => `<a href="/uploads/${att}" target="_blank" class="text-blue-400" download>${att}</a>`).join('<br>');
        } else {
            attachmentsHTML = 'No attachments available';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${mom.heading}</td>
            <td>${new Date(mom.dateTime).toLocaleString()}</td>
            <td>${attachmentsHTML}</td>
            <td>
                <button class="view-button bg-blue-500 text-white py-1 px-3 rounded-md mr-2" data-id="${mom._id}">View</button>
                <button class="edit-button bg-yellow-500 text-white py-1 px-3 rounded-md mr-2" data-id="${mom._id}">Edit</button>
                <button class="delete-button bg-red-500 text-white py-1 px-3 rounded-md" data-id="${mom._id}">Delete</button>
            </td>
        `;
        momTable.appendChild(row);
    });

    // Add event listeners for the buttons
    document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const momId = e.target.dataset.id;
            viewMoM(momId);
        });
    });

    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const momId = e.target.dataset.id;
            editMoM(momId);
        });
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const momId = e.target.dataset.id;
            deleteMoM(momId);
        });
    });
}

// Fetch and display details of a specific MoM when "View" button is clicked
async function viewMoM(momId) {
    try {
        const response = await fetch(`/api/mom/view/${momId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const mom = await response.json();
            displayMoMDetails(mom);
        } else {
            console.error('Error fetching MoM:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching MoM:', error);
    }
}

// Display MoM details in a new modal, including attachments
function displayMoMDetails(mom) {
    const viewMoMModal = document.createElement('div');
    viewMoMModal.id = 'viewMoMModal';
    viewMoMModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    
    let attachmentsHTML = '';
    if (mom.attachments && mom.attachments.length > 0) {
        attachmentsHTML = mom.attachments.map(att => `<a href="/uploads/${att}" target="_blank" class="text-blue-400" download>${att}</a>`).join('<br>');
    } else {
        attachmentsHTML = 'No attachments available';
    }

    viewMoMModal.innerHTML = `
        <div class="bg-gray-900 p-8 rounded-lg w-1/2">
            <h2 class="text-lg font-bold mb-4">View Minutes of Meeting</h2>
            <p><strong>Heading:</strong> ${mom.heading}</p>
            <p><strong>Summary:</strong> ${mom.summary}</p>
            <p><strong>Date and Time:</strong> ${new Date(mom.dateTime).toLocaleString()}</p>
            <p><strong>Attachments:</strong><br>${attachmentsHTML}</p>
            <div class="flex justify-end mt-4">
                <button id="closeViewButton" class="bg-gray-500 py-2 px-4 rounded-md">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(viewMoMModal);

    // Close the modal
    document.getElementById('closeViewButton').addEventListener('click', function () {
        viewMoMModal.remove();
    });
}

// Edit MoM functionality
async function editMoM(momId) {
    try {
        const response = await fetch(`/api/mom/view/${momId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const mom = await response.json();
            openEditMoMModal(mom);
        } else {
            console.error('Error fetching MoM for editing:', await response.text());
        }
    } catch (error) {
        console.error('Error fetching MoM for editing:', error);
    }
}

// Open the edit modal and populate it with MoM data
function openEditMoMModal(mom) {
    const editMoMModal = document.createElement('div');
    editMoMModal.id = 'editMoMModal';
    editMoMModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    
    editMoMModal.innerHTML = `
        <div class="bg-gray-900 p-8 rounded-lg w-1/2">
            <h2 class="text-lg font-bold mb-4">Edit Minutes of Meeting</h2>
            <form id="editMoMForm">
                <div class="mb-4">
                    <label>Heading:</label>
                    <input type="text" id="editHeading" class="w-full p-2 rounded-md bg-gray-700" value="${mom.heading}">
                </div>
                <div class="mb-4">
                    <label>Summary:</label>
                    <textarea id="editSummary" class="w-full p-2 rounded-md bg-gray-700">${mom.summary}</textarea>
                </div>
                <div class="mb-4">
                    <label>Date and Time:</label>
                    <input type="datetime-local" id="editDateTime" class="w-full p-2 rounded-md bg-gray-700" value="${new Date(mom.dateTime).toISOString().slice(0, 16)}">
                </div>
                <div class="mb-4">
                    <label>Attachments:</label>
                    <div id="currentAttachments" class="mb-2">
                        ${mom.attachments && mom.attachments.length > 0 ? mom.attachments.map(att => `<a href="/uploads/${att}" target="_blank" class="text-blue-400" download>${att}</a>`).join('<br>') : 'No attachments available'}
                    </div>
                    <input type="file" id="editAttachments" class="w-full p-2 rounded-md bg-gray-700" multiple>
                </div>
                <div class="flex justify-between">
                    <button type="button" id="cancelEditButton" class="bg-red-500 py-2 px-4 rounded-md">Cancel</button>
                    <button type="submit" class="bg-green-500 py-2 px-4 rounded-md">Save</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(editMoMModal);

    // Event listener for cancel button
    document.getElementById('cancelEditButton').addEventListener('click', function () {
        editMoMModal.remove();
    });

    // Handle form submission
    document.getElementById('editMoMForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const updatedMoM = {
            heading: document.getElementById('editHeading').value,
            summary: document.getElementById('editSummary').value,
            dateTime: document.getElementById('editDateTime').value
        };

        const attachments = document.getElementById('editAttachments').files;
        const formData = new FormData();
        formData.append('heading', updatedMoM.heading);
        formData.append('summary', updatedMoM.summary);
        formData.append('dateTime', updatedMoM.dateTime);
        for (let i = 0; i < attachments.length; i++) {
            formData.append('attachments', attachments[i]);
        }

        try {
            const response = await fetch(`/api/mom/update/${mom._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            if (response.ok) {
                alert('MoM updated successfully');
                editMoMModal.remove(); // Close the modal
                fetchMoMs(localStorage.getItem('leadId')); // Refresh the MoM list
            } else {
                console.error('Error updating MoM:', await response.text());
            }
        } catch (error) {
            console.error('Error updating MoM:', error);
        }
    });
}

// Function to reset the form after submission
function resetMoMForm() {
    document.getElementById('heading').value = '';
    document.getElementById('summary').value = '';
    document.getElementById('dateTime').value = '';
    document.getElementById('attachments').value = '';
}

// Function to close the "Create MoM" modal
function closeMoMModal() {
    document.getElementById('createMoMModal').classList.add('hidden');
}
