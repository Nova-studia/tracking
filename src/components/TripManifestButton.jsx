import React from 'react';
import { PDFDownloadLink, Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import PropTypes from 'prop-types';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logoSection: {
    width: '33%',
  },
  logo: {
    width: 120,
    height: 80,
  },
  titleSection: {
    width: '33%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverSection: {
    width: '33%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyInfo: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 12,
  },
  driverInfo: {
    textAlign: 'right',
  },
  driverName: {
    fontWeight: 'bold',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    padding: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableCell: {
    fontSize: 9,
  },
  // Tamaños de columna ajustados para incluir STORAGE y TOTAL
  colCustomer: { width: '12%' },
  colOrder: { width: '8%' },
  colStock: { width: '9%' },
  colCar: { width: '12%' },
  colYear: { width: '6%' },
  colPin: { width: '8%' },
  colCity: { width: '12%' },
  colSubasta: { width: '9%' },
  colFlete: { width: '8%' },
  colStorage: { width: '8%' },
  colTotal: { width: '8%' }
});

// Documento PDF
const TripManifestPDF = ({ driver, vehicles, date }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* Encabezado con logo, título y datos del conductor */}
      <View style={styles.headerSection}>
        {/* Logo a la izquierda */}
        <View style={styles.logoSection}>
          <Image 
            src="/Logo3.png" 
            style={styles.logo} 
          />
        </View>
        
        {/* Título en el centro */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Bill of Lading</Text>
        </View>
        
        {/* Datos del conductor a la derecha */}
        <View style={styles.driverSection}>
          <Text>Driver: <Text style={styles.driverName}>{driver.name}</Text></Text>
          <Text>Date: {date}</Text>
        </View>
      </View>
      
      {/* Información de la empresa centrada */}
      <View style={styles.companyInfo}>
        <Text>Jorge Minnesota Logistic LLC</Text>
        <Text>932 N. Minnesota Ave.</Text>
        <Text>Brownsville Tx.</Text>
        <Text>+(956) 371-8314</Text>
      </View>
      
      {/* Tabla de vehículos */}
      <View style={styles.table}>
        {/* Encabezados de tabla */}
        <View style={styles.tableRow}>
          <View style={[styles.tableColHeader, styles.colCustomer]}>
            <Text style={styles.tableHeader}>CUSTOMER</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colOrder]}>
            <Text style={styles.tableHeader}>ORDER</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colStock]}>
            <Text style={styles.tableHeader}>STOCK#</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colCar]}>
            <Text style={styles.tableHeader}>CAR</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colYear]}>
            <Text style={styles.tableHeader}>YEAR</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colPin]}>
            <Text style={styles.tableHeader}>PIN BUYER</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colCity]}>
            <Text style={styles.tableHeader}>CITY</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colSubasta]}>
            <Text style={styles.tableHeader}>SUBASTA</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colFlete]}>
            <Text style={styles.tableHeader}>FLETE</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colStorage]}>
            <Text style={styles.tableHeader}>STORAGE</Text>
          </View>
          <View style={[styles.tableColHeader, styles.colTotal]}>
            <Text style={styles.tableHeader}>TOTAL</Text>
          </View>
        </View>
        
        {/* Filas de datos */}
        {vehicles.map((vehicle, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={[styles.tableCol, styles.colCustomer]}>
              <Text style={styles.tableCell}>
                {vehicle.clientId?.name || (typeof vehicle.clientId === 'string' ? vehicle.clientId : 'N/A')}
              </Text>
            </View>
            <View style={[styles.tableCol, styles.colOrder]}>
              <Text style={styles.tableCell}>{vehicle.PIN || 'N/A'}</Text>
            </View>
            <View style={[styles.tableCol, styles.colStock]}>
              <Text style={styles.tableCell}>{vehicle.LOT || 'N/A'}</Text>
            </View>
            <View style={[styles.tableCol, styles.colCar]}>
              <Text style={styles.tableCell}>{vehicle.brand} {vehicle.model}</Text>
            </View>
            <View style={[styles.tableCol, styles.colYear]}>
              <Text style={styles.tableCell}>{vehicle.year || 'N/A'}</Text>
            </View>
            <View style={[styles.tableCol, styles.colPin]}>
              <Text style={styles.tableCell}>{vehicle.PIN || 'N/A'}</Text>
            </View>
            <View style={[styles.tableCol, styles.colCity]}>
              <Text style={styles.tableCell}>
                {vehicle.city || (vehicle.lotLocation ? vehicle.lotLocation.split(',')[0] : 'N/A')}
              </Text>
            </View>
            <View style={[styles.tableCol, styles.colSubasta]}>
              <Text style={styles.tableCell}>{vehicle.auctionHouse || 'N/A'}</Text>
            </View>
            <View style={[styles.tableCol, styles.colFlete]}>
              <Text style={styles.tableCell}></Text>
            </View>
            <View style={[styles.tableCol, styles.colStorage]}>
              <Text style={styles.tableCell}></Text>
            </View>
            <View style={[styles.tableCol, styles.colTotal]}>
              <Text style={styles.tableCell}></Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

// Componente para el botón de descarga
const TripManifestButton = ({ driver, vehicles }) => (
  <PDFDownloadLink 
    document={<TripManifestPDF driver={driver} vehicles={vehicles} date={new Date().toLocaleDateString()} />} 
    fileName={`manifiesto_${driver.name}_${new Date().toISOString().split('T')[0]}.pdf`}
    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
  >
    {({ blob, url, loading, error }) =>
      loading ? 'Generando documento...' : 'Imprimir Manifiesto'
    }
  </PDFDownloadLink>
);

TripManifestPDF.propTypes = {
  driver: PropTypes.object.isRequired,
  vehicles: PropTypes.array.isRequired,
  date: PropTypes.string.isRequired,
};

TripManifestButton.propTypes = {
  driver: PropTypes.object.isRequired,
  vehicles: PropTypes.array.isRequired,
};

export default TripManifestButton;