document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('syndicateToken');
  const syndicateId = localStorage.getItem('syndicateId');

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let totalPages = 1;

  if (token) {
      fetchSyndicateDetails(token);
      fetchSyndicateClients(token, currentPage);
  } else if (syndicateId) {
      fetchSyndicateDetailsForAdmin(syndicateId);
  } else {
      console.error('Syndicate token or ID not found.');
  }

  async function fetchSyndicateDetails(token) {
    try {
      const response = await fetch('/api/syndicate-details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const syndicateUser = await response.json();
        displaySyndicateDetails(syndicateUser);
      } else {
        console.error('Error fetching syndicate details:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching syndicate details:', error);
    }
  }

  async function fetchSyndicateDetailsForAdmin(syndicateId) {
    try {
      const response = await fetch(`/api/syndicate-details/${syndicateId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      if (response.ok) {
        const syndicateUser = await response.json();
        displaySyndicateDetails(syndicateUser);
      } else {
        console.error('Error fetching syndicate details for admin:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching syndicate details for admin:', error);
    }
  }

  function displaySyndicateDetails(user) {
    const profileCard = document.getElementById('profile-card');
    if (profileCard) {
      profileCard.innerHTML = `
          <div class="flex items-center">
              <div>
                  <p class="text-lg font-bold">Strategy Partner: ${user.syndicate_name}</p>
                  <p class="text-sm">User ID: ${user.user_id}</p>
                  <p class="text-sm">Designation: ${user.designation}</p>
              </div>
          </div>
      `;
    } else {
      console.error('Profile card element not found.');
    }
  }

  // Fetch syndicate clients with pagination
  async function fetchSyndicateClients(token, page = 1) {
    try {
      const response = await fetch(`/api/syndicateclients?page=${page}&size=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Data received:', data); // Debugging log
        const syndicateClients = data.clients || []; // Set to empty array if undefined
        totalPages = Math.ceil((data.totalCount || 0) / PAGE_SIZE);
        populateTable(syndicateClients);
        renderPagination();
      } else {
        console.error('Error fetching syndicate clients:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching syndicate clients:', error);
    }
  }
    
  // Populate the client table with data and include serial number column
  function populateTable(clients) {
    const tableBody = document.getElementById('client-table-body');
    tableBody.innerHTML = '';

    // Ensure `clients` is an array before attempting to loop
    if (!Array.isArray(clients)) {
        console.error('Expected clients to be an array, but got:', clients);
        return;
    }

    clients.forEach((client, index) => {
        const profileImage = client.faceImage ? `/images/${client.faceImage}` : 'https://via.placeholder.com/80';
        const row = `
        <tr>
          <td class="py-2 px-4">${index + 1}</td> <!-- Serial number -->
          <td class="py-2 px-4">
            <img id="profile-img" src="${profileImage}" alt="Profile" class="profile-img cursor-pointer" style="width: 50px; height: 50px; border-radius: 50%;" onclick="openImagePopup('${profileImage}')">
          </td>
          <td class="py-2 px-4">${client.name || 'N/A'}</td>
          <td class="py-2 px-4">${client.domain || 'N/A'}</td>
          <td class="py-2 px-4">
            <div class="relative inline-block text-left">
              <button onclick="toggleDropdown('${client._id}', event)" class="bg-blue-500 px-2 py-1 rounded">Actions</button>
              <div id="dropdown-${client._id}" class="dropdown-content hidden bg-white text-black absolute z-10">
                <a href="#" onclick="handleViewClient('${client._id}')">View</a>
                <a href="#" onclick="handleEditClient('${client._id}')">Edit</a>
                <a href="#" onclick="handleDeleteClient('${client._id}')">Delete</a>
              </div>
            </div>
          </td>
          <td class="py-2 px-4">
            <button onclick="handleAddDetailsClick(event, '${client._id}')" class="bg-green-500 px-2 py-1 rounded">Add</button>
          </td>
          <td class="py-2 px-4">
            <button href="./mom.html" onclick="handleAddDetailsClick1(event, '${client._id}')" class="bg-green-500 px-2 py-1 rounded">Log</button>
          </td>
          <td class="py-2 px-4">
            <button href="./schedule_meeting.html" onclick="handleAddDetailsClick2(event, '${client._id}')" class="bg-green-500 px-2 py-1 rounded">Schedule</button>
          </td>
          <td class="py-2 px-4">
            <select id="priority-${client._id}" class="priority-select" onchange="handleDropdownChange('${client._id}', this.value)">
    <option value="" disabled selected>Select Action</option>
    <option value="set-priority">Set Priority</option>
    <option value="set-client-status">Set Client Status</option>
</select>

          </td>
         <td class="py-2 px-4">
    <button onclick="generateAndDownloadQRCode('${client._id}')" class="bg-blue-500 px-2 py-1 rounded">Download QR</button>
</td>
        </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

// Download QR Code Feature 
window.generateAndDownloadQRCode = async function (clientId) {
  try {
      const pageUrl = `https://www.erp.posspole.com/visitor.html`;
      const qrData = `${pageUrl}?client_id=${clientId}`;

      // Generate the QR code data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'M',
          width: 300,
          margin: 2,
      });

      // Create a download link for the QR code
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `${clientId}-qrcode.png`;

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`QR Code generated and downloaded for client ID: ${clientId}`);
  } catch (error) {
      console.error('Error generating QR code:', error);
  }
};


// dropdown change

window.handleDropdownChange = function(clientId, selectedValue) {
  console.log("Dropdown change triggered", { clientId, selectedValue });

  if (selectedValue === 'set-priority') {
      openModal('set-priority-modal', clientId);
  } else if (selectedValue === 'set-client-status') {
      openModal('set-client-status-modal', clientId);
  } else {
      console.error('Unexpected value selected:', selectedValue);
  }

  // Reset dropdown value to default after selection
  const dropdown = document.getElementById(`priority-${clientId}`);
  if (dropdown) dropdown.value = '';
};



// Open a modal and fetch the appropriate "Last Updated" value
// Open a modal and populate dropdown and comments
// Open a modal and populate dropdown and comments
window.openModal = async function (modalId, clientId) {
  const modal = document.getElementById(modalId);
  if (!modal) {
    console.error(`Modal with ID "${modalId}" not found.`);
    return;
  }

  try {
    // Fetch the token
    const token = localStorage.getItem('syndicateToken');
    if (!token) {
      console.warn('No authentication token found in localStorage.');
      alert('You are not logged in or your session has expired. Please log in again.');
      return;
    }

    // Fetch the client details from the backend
    const response = await fetch(`http://localhost:5001/api/syndicateclient/${clientId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch client details: ${errorData.message || response.statusText}`);
    }

    const clientData = await response.json();
    console.log('Fetched client data:', clientData);

    // Determine the field to display in "Last Updated"
    const lastUpdatedElement = modal.querySelector('.last-updated span.text-green-500');
    if (lastUpdatedElement) {
      let lastUpdatedValue = 'Not Set';

      if (modalId === 'set-priority-modal') {
        lastUpdatedValue = clientData.priority || 'Not Set';
      } else if (modalId === 'set-client-status-modal') {
        lastUpdatedValue = clientData.client_status || 'Not Set';
      }

      lastUpdatedElement.textContent = lastUpdatedValue;
    }

    // Populate dropdown with the existing value
    const dropdown = modal.querySelector('select');
    if (dropdown) {
      if (modalId === 'set-priority-modal') {
        dropdown.value = clientData.priority || '';
      } else if (modalId === 'set-client-status-modal') {
        dropdown.value = clientData.client_status || '';
      }
    }

    // Populate comments from the backend
    const commentsBox = modal.querySelector('textarea');
    if (commentsBox) {
      if (modalId === 'set-priority-modal') {
        commentsBox.value = clientData.priority_comments || '';
      } else if (modalId === 'set-client-status-modal') {
        commentsBox.value = clientData.client_comments || '';
      }
    }

    // Set clientId to the modal for further use
    modal.dataset.clientId = clientId;

    // Show the modal
    modal.style.display = 'flex';
  } catch (error) {
    console.error('Error fetching client details:', error);
    alert('Failed to fetch client details. Please try again.');
  }
};

// Save priority and comments
window.savePriority = async function () {
  const modal = document.getElementById('set-priority-modal');
  if (!modal) {
    console.error('Priority modal not found.');
    return;
  }

  const clientId = modal.dataset.clientId;
  const priority = document.getElementById('priority-level').value;
  const comments = document.getElementById('comments-box-priority').value;
  const token = localStorage.getItem('syndicateToken');

  if (!priority) {
    alert('Please select a priority level.');
    return;
  }

  try {
    // Update priority
    const priorityResponse = await fetch(`/api/syndicateclients/${clientId}/priority`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priority }),
    });

    if (!priorityResponse.ok) {
      const errorData = await priorityResponse.json();
      throw new Error(`Failed to update priority: ${errorData.message}`);
    }

    // Update priority comments
    const commentsResponse = await fetch(`/api/syndicateclients/${clientId}/priority-comments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priority_comments: comments }),
    });

    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.json();
      throw new Error(`Failed to update comments: ${errorData.message}`);
    }

    alert(`Priority and comments updated successfully.`);

    // Optionally refresh the client list after updating
    fetchSyndicateClients(token);

    // Close the modal after success
    window.closeModal('set-priority-modal');
  } catch (error) {
    console.error('Error updating priority or comments:', error);
    alert('Failed to update priority or comments. Please try again.');
  }
};

// Save client status and comments
window.saveClientStatus = async function () {
  const modal = document.getElementById('set-client-status-modal');
  if (!modal) {
    console.error('Client Status modal not found.');
    return;
  }

  const clientId = modal.dataset.clientId;
  const status = document.getElementById('client-status').value;
  const comments = document.getElementById('comments-box-status').value;
  const token = localStorage.getItem('syndicateToken');

  if (!status) {
    alert('Please select a client status.');
    return;
  }

  try {
    // Update client status
    const statusResponse = await fetch(`/api/syndicateclients/${clientId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client_status: status }),
    });

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json();
      throw new Error(`Failed to update client status: ${errorData.message}`);
    }

    // Update client comments
    const commentsResponse = await fetch(`/api/syndicateclients/${clientId}/client-comments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ client_comments: comments }),
    });

    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.json();
      throw new Error(`Failed to update comments: ${errorData.message}`);
    }

    alert(`Client status and comments updated successfully.`);

    // Optionally refresh the client list after updating
    fetchSyndicateClients(token);

    // Close the modal after success
    window.closeModal('set-client-status-modal');
  } catch (error) {
    console.error('Error updating client status or comments:', error);
    alert('Failed to update client status or comments. Please try again.');
  }
};

// Close the modal
window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    console.log(`Modal "${modalId}" closed.`);
  } else {
    console.error(`Modal with ID "${modalId}" not found.`);
  }
};



  function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.innerText = 'Previous';
    prevButton.classList.add('px-3', 'py-1', 'rounded', 'border', 'border-gray-500', 'bg-gray-500', 'text-white');
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
      if (currentPage > 1) fetchSyndicateClients(localStorage.getItem('syndicateToken'), --currentPage);
    };
    paginationContainer.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.classList.add('px-3', 'py-1', 'rounded', 'border', 'border-gray-500', 'bg-blue-500', 'text-white');
      if (i === currentPage) {
        pageButton.classList.add('bg-blue-700');
      }
      pageButton.innerText = i;
      pageButton.disabled = i === currentPage;
      pageButton.onclick = () => {
        currentPage = i;
        fetchSyndicateClients(localStorage.getItem('syndicateToken'), currentPage);
      };
      paginationContainer.appendChild(pageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerText = 'Next';
    nextButton.classList.add('px-3', 'py-1', 'rounded', 'border', 'border-gray-500', 'bg-gray-500', 'text-white');
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
      if (currentPage < totalPages) fetchSyndicateClients(localStorage.getItem('syndicateToken'), ++currentPage);
    };
    paginationContainer.appendChild(nextButton);
  }


 // Toggle the dropdown menu
window.toggleDropdown = function(clientId, event) {
    event.stopPropagation(); // Prevent click from bubbling to document

    // Hide any other open dropdowns
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        if (dropdown.id !== `dropdown-${clientId}`) {
            dropdown.classList.add('hidden');
        }
    });

    // Toggle the clicked dropdown
    const dropdown = document.getElementById(`dropdown-${clientId}`);
    dropdown.classList.toggle('hidden');
};

// Close the dropdown if clicked outside
document.addEventListener('click', (event) => {
    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });
});


    // Function to open the image popup with the clicked image
    function openImagePopup(imageUrl) {
      const imagePopup = document.getElementById('imagePopup');
      const popupImage = document.getElementById('popupImage');

      popupImage.src = imageUrl;
      imagePopup.classList.remove('hidden');
    }

    window.openImagePopup = openImagePopup;

    document.getElementById('closePopup').addEventListener('click', () => {
      document.getElementById('imagePopup').classList.add('hidden');
    });

    // Handle client view, edit, and delete actions
    window.handleViewClient = function (clientId) {
      localStorage.setItem('clientId', clientId);
      window.location.href = './syndicate_client_side_customerview.html';
    };

    // Handle Delete Client
    window.handleDeleteClient = async function(clientId) {
        if (confirm('Are you sure you want to delete this client?')) {
          try {
            const response = await fetch(`/api/client/${clientId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('syndicateToken')}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              alert('Client deleted successfully');
              fetchSyndicateClients(localStorage.getItem('syndicateToken')); // Reload the client list
            } else {
              alert('Error deleting client');
            }
          } catch (error) {
            console.error('Error deleting client:', error);
            alert('Server error while deleting client');
          }
        }
    };
    
    let currentClientId = null; // Declare globally

    // Handle Edit Client button click
    window.handleEditClient = async function (clientId) {
        currentClientId = clientId; // Set the global clientId
        console.log('Edit button clicked, clientId:', clientId);
        
        const client = await fetchClientDetails(clientId);
        if (client) {
            console.log('Client details fetched:', client);
            populateEditForm(client); // Populate the form with client details
            
            // Fetch and populate syndicate names for the dropdown
            await fetchSyndicateNames(); 
    
            const detailsSection = document.getElementById('client-details-section');
            detailsSection.classList.remove('hidden'); // Show the section
        } else {
            console.error('Failed to fetch client details');
        }
    };
    
   // Hide the client details section (close modal)
function hideClientDetails() {
    console.log("hideClientDetails function called"); // Check if function is called
    const detailsSection = document.getElementById('client-details-section');
    if (detailsSection) {
        detailsSection.classList.add('hidden'); // Hide the section
    } else {
        console.error('Details section not found');
    }
}

// Example to trigger the function:
document.getElementById('close-btn').addEventListener('click', hideClientDetails);

    // Close the modal when clicking outside the modal content
    window.onclick = function(event) {
        const detailsSection = document.getElementById('client-details-section');
        if (event.target === detailsSection) {
            hideClientDetails(); // Hide modal if user clicks outside the content
        }
    };
    
    // Function to fetch client details
    async function fetchClientDetails(clientId) {
        try {
            const response = await fetch(`/api/client/${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('syndicateToken')}`
                }
            });
            if (response.ok) {
                const client = await response.json();
                console.log('Fetched client:', client);
                return client;
            } else {
                const errorData = await response.json();
                console.error('Error fetching client details:', errorData);
            }
        } catch (error) {
            console.error('Error fetching client details:', error);
        }
        alert('Error fetching client details');
        return null;
    }
    
    // Function to populate form with client details
    function populateEditForm(client) {
        document.getElementById('edit-personToMeet').value = client.personToMeet;
        document.getElementById('edit-name').value = client.name;
        document.getElementById('edit-phone').value = client.phone;
        document.getElementById('edit-email').value = client.email;
        document.getElementById('edit-companyName').value = client.companyName;
        document.getElementById('edit-domain-input').value = client.domain;
        document.getElementById('edit-personReferred').value = client.personReferred; // Make sure to set this value
    }
    
    // Function to fetch syndicate names and populate the personReferred dropdown
    async function fetchSyndicateNames() {
        try {
            const response = await fetch('/api/syndicates'); // Adjust the path according to your backend route
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
        const personReferredField = document.getElementById('edit-personReferred');
        personReferredField.innerHTML = ''; // Clear any existing options
    
        // Add a default "Select" option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'I am referred by?';
        personReferredField.appendChild(defaultOption);
    
        // Add each syndicate's name as an option
        syndicates.forEach(syndicate => {
            const option = document.createElement('option');
            option.value = syndicate.syndicate_name;
            option.textContent = syndicate.syndicate_name;
            personReferredField.appendChild(option);
        });
    }
    
    window.updateClientDetails = async function () {
        const updatedClient = {
            name: document.getElementById('edit-name').value,
            phone: document.getElementById('edit-phone').value,
            companyName: document.getElementById('edit-companyName').value,
            email: document.getElementById('edit-email').value,
            personToMeet: document.getElementById('edit-personToMeet').value,
            personReferred: document.getElementById('edit-personReferred').value, // Updated value from dropdown
            domain: document.getElementById('edit-domain-input').value
        };
    
        try {
            const response = await fetch(`/api/client/update/${currentClientId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('syndicateToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedClient) // Send the updated client details
            });
    
            if (response.ok) {
                alert('Client details updated successfully');
                hideClientDetails(); // Hide the section after saving
                fetchSyndicateClients(localStorage.getItem('syndicateToken')); // Refresh the client list
            } else {
                const errorData = await response.json();
                console.error('Error updating client:', errorData.message);
                alert('Error updating client details. Please try again.');
            }
        } catch (error) {
            console.error('Error updating client details:', error);
            alert('Error updating client details. Please try again.');
        }
    };
    

    // Add details click handlers for other actions
    window.handleAddDetailsClick = function (event, clientId) {
        event.preventDefault(); // Prevent default anchor behavior
        localStorage.setItem('clientId', clientId); // Store the clientId in localStorage
        window.location.href = './syndicate_client_data_entry.html'; // Redirect to the data entry page
    };

    window.handleAddDetailsClick1 = function (event, clientId) {
        event.preventDefault(); // Prevent default anchor behavior
        localStorage.setItem('clientId', clientId); // Store the clientId in localStorage
        window.location.href = './mom.html'; // Redirect to the MoM log page
    };

    window.handleAddDetailsClick2 = function (event, clientId) {
        event.preventDefault(); // Prevent default anchor behavior
        localStorage.setItem('clientId', clientId); // Store the clientId in localStorage
        window.location.href = './schedule_meeting.html'; // Redirect to the schedule meeting page
    };

    // // Function to update the priority color dynamically
    // window.updatePriorityColor = function (clientId) {
    //     const selectElement = document.getElementById(`priority-${clientId}`);
    //     const selectedPriority = selectElement.value;

    //     // Update background color based on selected priority
    //     if (selectedPriority === 'high') {
    //         selectElement.style.backgroundColor = '#FF6347'; // Red for high priority
    //     } else if (selectedPriority === 'medium') {
    //         selectElement.style.backgroundColor = '#FFD700'; // Yellow for medium priority
    //     } else {
    //         selectElement.style.backgroundColor = '#90EE90'; // Green for low priority
    //     }
    // };

    // Function to handle saving the updated priority
    window.handleSavePriority = async function (clientId) {
        const selectElement = document.getElementById(`priority-${clientId}`);
        const newPriority = selectElement.value;

        try {
            const response = await fetch(`/api/syndicateclients/${clientId}/priority`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('syndicateToken')}`
                },
                body: JSON.stringify({ priority: newPriority })
            });

            if (response.ok) {
                alert('Priority updated successfully');
            } else {
                const errorData = await response.json();
                console.error('Error updating priority:', errorData.message);
                alert('Error updating priority. Please try again.');
            }
        } catch (error) {
            console.error('Error updating priority:', error);
            alert('Error updating priority. Please try again.');
        }
    };
});


document.getElementById('copyInviteLinkButton').addEventListener('click', async () => {
  const syndicateToken = localStorage.getItem('syndicateToken'); // Fetch the token

  try {
      // Get the user's syndicate_name or user_id from the backend
      const response = await fetch('/api/getSyndicateInfo', {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${syndicateToken}` // Send token in Authorization header
          }
      });

      const userData = await response.json();
      const syndicateName = userData.syndicate_name; // Get the syndicate_name from the response

      const inviteLink = `https://www.posspole.line.pm/syndicate_client_side_visitorform.html?referrer=${syndicateName}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);
      alert("Invite link copied to clipboard!");
  } catch (error) {
      console.error("Failed to copy invite link:", error);
      alert("Failed to copy invite link.");
  }
});

 