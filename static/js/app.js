document.addEventListener("DOMContentLoaded", function () { 
  // Get elements
  const snNotApplicableCheckbox = document.getElementById('sn-not-applicable');
  const serialNumberField = document.getElementById('serialNumber');
  const isDiscountedDropdown = document.getElementById('isDiscounted');
  const maxDiscountField = document.getElementById('maxDiscount');  
  const buyingPriceField = document.getElementById('buyingPrice');
  const sellingPriceField = document.getElementById('sellingPrice');
  const addItemForm = document.getElementById('add-item-form');

  

  // Check if elements exist before adding event listeners
  if (snNotApplicableCheckbox && serialNumberField) {
    snNotApplicableCheckbox.addEventListener('change', function () {
      if (this.checked) {
        serialNumberField.disabled = true; // Disable the serial number field
        serialNumberField.value = ''; // Clear the serial number field
      } else {
        serialNumberField.disabled = false; // Enable the serial number field
      }
    });
  }

  if (isDiscountedDropdown && maxDiscountField) {
    isDiscountedDropdown.addEventListener('change', function () {
      // Check if the value is 'true' to enable the discount amount field
      if (this.value === 'true') {
        maxDiscountField.disabled = false; // Enable the discount amount field
      } else {
        maxDiscountField.disabled = true; // Disable the discount amount field when no discount
      }
    });
  }

  if (addItemForm) {
    addItemForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const formData = new FormData(this);
      const itemData = {
        name: formData.get('name'),
        category: formData.get('category'),
        serialNumber: formData.get('serialNumber') || 'N/A', // Use 'N/A' if serial number is not provided
        quantity: formData.get('quantity'),
        purchaseDate: formData.get('purchaseDate'),
        condition: formData.get('condition'),
        buyingPrice: parseFloat(formData.get('buyingPrice')),  // Get buyingPrice from form
        sellingPrice: parseFloat(formData.get('sellingPrice')),  // Get sellingPrice from form
        maxDiscount: isDiscountedDropdown && isDiscountedDropdown.value === 'true' 
                      ? parseFloat(formData.get('maxDiscount')) 
                      : 0,  // Set maxDiscount to 0 if not discounted
        isDiscounted: isDiscountedDropdown ? isDiscountedDropdown.value === 'true' : false,  // Check if discount is selected in dropdown
      };

      // If the serial number is not applicable, set it to 'N/A'
      if (snNotApplicableCheckbox.checked) {
        itemData.serialNumber = 'N/A';
      }

      // Send a POST request to your API to add the item
      fetch('/api/add-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Item added successfully!');
          addItemForm.reset(); // Reset form after successful submission
        } else {
          alert('Failed to add item: ' + data.message);
        }
      })
    });
  }

    const faultyItemForm = document.getElementById('faultyItemForm');

    if (faultyItemForm) {
      faultyItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const name = document.getElementById('faulty-name').value;
        const quantity = document.getElementById('faulty-quantity').value;
        const reason = document.getElementById('reason').value;
        const formMessage = document.getElementById('formMessage');
  
        try {
          const response = await fetch('/api/faulty-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, quantity, reason })
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            throw new Error(data.message || 'Failed to add item.');
          }
  
          formMessage.textContent = data.message || 'Faulty item added successfully!';
          faultyItemForm.reset();
        } catch (error) {
          formMessage.textContent = 'Error: ' + error.message;
        }
      });
    }
});