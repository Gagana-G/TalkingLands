import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const customIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const POINT_API_URL = "https://jsonplaceholder.typicode.com/users";
const POLYGON_API_URL = "https://api.mocki.io/v2/79b8c51c/polygons"; 

const MapEvents = ({ setFeatureData, pointData, polygonData }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      let selectedFeature = null;

      pointData.forEach((point) => {
        if (
          Math.abs(point.lat - lat) < 0.01 &&
          Math.abs(point.lng - lng) < 0.01
        ) {
          selectedFeature = { type: "Point", name: point.name, lat: point.lat, lng: point.lng };
        }
      });

      if (!selectedFeature && Array.isArray(polygonData)) {
        polygonData.forEach((polygon, index) => {
          if (Array.isArray(polygon)) {
            const polygonBounds = L.polygon(polygon).getBounds();
            if (polygonBounds.contains([lat, lng])) {
              selectedFeature = { type: "Polygon", name: `Polygon ${index + 1}` };
            }
          }
        });
      }

      if (selectedFeature) {
        setFeatureData(selectedFeature);
      } else {
        setFeatureData({ lat, lng, type: "Map Click" });
      }
    },
  });
  return null;
};

const App = () => {
  const [featureData, setFeatureData] = useState(null);
  const [pointData, setPointData] = useState([]);
  const [polygonData, setPolygonData] = useState([]);

  useEffect(() => {
    const fetchSpatialData = async () => {
      try {
        const pointsResponse = await fetch(POINT_API_URL);
        const polygonsResponse = await fetch(POLYGON_API_URL);

        const points = await pointsResponse.json();
        const polygons = await polygonsResponse.json();

        console.log("Polygons:", polygons); 

        const formattedPoints = points.map((p, index) => ({
          id: index + 1,
          lat: parseFloat(p.address.geo.lat),
          lng: parseFloat(p.address.geo.lng),
          name: p.name,
        }));

        setPointData(formattedPoints);
        setPolygonData(polygons);
      } catch (error) {
        console.error("Error fetching spatial data:", error);
      }
    };
    fetchSpatialData();
  }, []);

  return (
    <div>
      <h1>Interactive Map with Spatial API</h1>
      <MapContainer center={[38.8951, -77.0364]} zoom={5} style={{ height: "80vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {pointData.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={customIcon}>
            <Popup>
              <b>{point.name}</b>
            </Popup>
            <Tooltip>{point.name}</Tooltip>
          </Marker>
        ))}

        {polygonData.length > 0 &&
          polygonData.map((polygon, index) => (
            <Polygon key={index} positions={polygon} color="blue">
              <Tooltip>{`Polygon ${index + 1}`}</Tooltip>
            </Polygon>
          ))}

        <MapEvents setFeatureData={setFeatureData} pointData={pointData} polygonData={polygonData} />
      </MapContainer>

      {featureData && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
          <h2>Feature Data</h2>
          {featureData.type === "Point" && (
            <>
              <p>
                <strong>Type:</strong> Point
              </p>
              <p>
                <strong>Name:</strong> {featureData.name}
              </p>
              <p>
                <strong>Latitude:</strong> {featureData.lat}
              </p>
              <p>
                <strong>Longitude:</strong> {featureData.lng}
              </p>
            </>
          )}
          {featureData.type === "Polygon" && (
            <>
              <p>
                <strong>Type:</strong> Polygon
              </p>
              <p>
                <strong>Name:</strong> {featureData.name}
              </p>
            </>
          )}
          {featureData.type === "Map Click" && (
            <>
              <p>
                <strong>Latitude:</strong> {featureData.lat}
              </p>
              <p>
                <strong>Longitude:</strong> {featureData.lng}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
