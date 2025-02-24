document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault(); // Evita el envío tradicional del formulario

  // Captura los datos del formulario
  const formData = new FormData(this);
  const username = formData.get('username');
  const password = formData.get('password');

  // Validar campos vacíos
  if (!username || !password) {
    showErrorAlert("Error", 'Por favor, complete todos los campos.');
    return;
  }

  // Mostrar alerta de "Espera"
  Swal.fire({
    title: 'Espere...',
    text: 'Procesando la solicitud',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Datos que se enviarán al backend
  const data = {
    username: username,
    password: password
  };

  try {
    // Enviar los datos al backend
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Verificar si la respuesta es JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();

      // Cerrar la alerta de "Espera"
      Swal.close();

      if (response.ok) {
        showSuccessAlert("Inicio de sesión exitoso", result.message || 'Bienvenido', '/principal');
      } else {
        showErrorAlert("Hubo un problema", result.error || 'Cédula o contraseña incorrectas.');
      }
    } else {
      throw new Error('La respuesta no es JSON');
    }
  } catch (error) {
    Swal.close();
    let errorMessage = 'Hubo un problema al procesar la solicitud.';
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      errorMessage = 'Error de red. Por favor, verifica tu conexión a internet.';
    }
    showErrorAlert("Error", errorMessage);
  }
});

function showErrorAlert(title, text) {
  Swal.fire({
    title: title,
    text: text,
    icon: "error",
    showConfirmButton: false,
    timer: 2500
  });
}

function showSuccessAlert(title, text, redirectUrl) {
  Swal.fire({
    title: title,
    text: text,
    icon: "success",
    showConfirmButton: false,
    timer: 2500
  }).then(() => {
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 2500);
  });
}