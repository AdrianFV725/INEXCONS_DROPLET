import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';

/**
 * Componente de carga que muestra un fondo oscuro con un indicador circular
 * durante operaciones asíncronas.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.open - Si el backdrop está visible o no
 * @returns {JSX.Element} - Elemento JSX
 */
const LoadingBackdrop = ({ open }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
      open={open}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default LoadingBackdrop; 