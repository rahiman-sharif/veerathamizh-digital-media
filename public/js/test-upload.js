// Test script for file uploads
console.log('Test upload script loaded');

// Make a simple ping request to check server connectivity
fetch('/order', { method: 'GET' })
  .then(response => {
    console.log('Server ping response:', response.status);
  })
  .catch(error => {
    console.error('Server ping error:', error);
  });

// Function to test file upload manually
window.testFileUpload = function(file) {
  console.log('Testing file upload with:', file);
  
  const formData = new FormData();
  formData.append('banner', file);
  
  return fetch('/order/upload-banner', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    console.log('Raw response:', response);
    return response.json();
  })
  .then(data => {
    console.log('Upload test response data:', data);
    return data;
  })
  .catch(error => {
    console.error('Upload test error:', error);
    throw error;
  });
};

// Add a global error handler for debugging
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
});
