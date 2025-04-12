document.addEventListener("DOMContentLoaded", function () {
  const restockBtn = document.getElementById('restock-btn');
  const restockModal = document.getElementById('restock-modal');
  const closeBtn = document.getElementById('close-btn');
  const restockForm = document.getElementById('restock-form');
  const itemSelect = document.getElementById('item-select');
  const formMessage = document.getElementById('formMessage');
  const loader = document.getElementById("loader");

  // Show Restock Modal (if triggered by button)
  if (restockBtn) {
    restockBtn.addEventListener("click", function () {
      openRestockModal();
    });
  }

  // Close Modal
  closeBtn.addEventListener("click", function () {
    restockModal.style.display = "none";
  });

  // Close Modal when clicking outside the content
  window.addEventListener("click", function (event) {
    if (event.target === restockModal) {
      restockModal.style.display = "none";
    }
  });

  // Handle Restock Form Submission
  restockForm.onsubmit = async function (e) {
    e.preventDefault();

    // Show loading spinner
    loader.style.display = "block";

    const formData = new FormData(restockForm);  // Get form data
    const itemId = formData.get("itemId");
    const quantity = formData.get("quantity");

    try {
      const response = await fetch("http://localhost:3000/api/restock-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity })
      });

      const result = await response.json();
      loader.style.display = "none";  // Hide spinner after response

      if (result.success) {
        formMessage.innerHTML = "✅ Item successfully restocked!";
        fetchNotifications();  // Refresh notifications to reflect changes
        setTimeout(() => {
          restockModal.style.display = "none";  // Close modal after restock
        }, 1500);
      } else {
        formMessage.innerHTML = `❌ ${result.message}`;
      }
    } catch (error) {
      loader.style.display = "none";
      formMessage.innerHTML = "❌ Error restocking item!";
      console.error("Restock error:", error);
    }
  };

  // Function to open the Restock Modal and populate items
  function openRestockModal() {
    const modal = document.getElementById("restock-modal");
    const itemSelect = document.getElementById("item-select");

    // Clear previous options
    itemSelect.innerHTML = "";

    // Fetch item details and populate the select box
    fetch("http://localhost:3000/api/items")  // Fetch all items from backend
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(items => {
        items.forEach(item => {
          const option = document.createElement("option");
          option.value = item._id;
          option.textContent = item.name;
          itemSelect.appendChild(option);
        });
      })
      .catch(error => {
        console.error("Error fetching items:", error);
        formMessage.innerHTML = `❌ Error fetching items: ${error.message}`;
      });


  modal.style.display = "block";  // Show modal
}
});

// Restock Item Using SweetAlert
function restockItem(itemId) {
  Swal.fire({
    title: "Restock Item",
    input: "number",
    inputLabel: "Enter quantity to restock",
    inputAttributes: {
      min: 1,
    },
    showCancelButton: true,
    confirmButtonText: "Restock",
  }).then((result) => {
    if (result.isConfirmed) {
      const quantity = result.value;

      fetch("http://localhost:3000/api/restock-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId, quantity }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            Swal.fire("Success!", data.message, "success");
            fetchNotifications();  // Refresh notifications after restocking
          } else {
            Swal.fire("Error", data.message, "error");
          }
        })
        .catch(error => {
          Swal.fire("Error", "Failed to restock item.", "error");
          console.error("Restock error:", error);
        });
    }
  });
}
