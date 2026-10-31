/** Decorative solar system for landing hero — Điểm Sáng highlighted */
const SolarSystem = () => {
  return (
    <div className="solar-system" aria-hidden="true">
      <div className="solar-stars" />

      <div className="solar-sun">
        <span className="solar-sun-core" />
        <span className="solar-sun-halo" />
      </div>

      {/* Mercury */}
      <div className="solar-orbit solar-orbit--1">
        <span className="solar-planet solar-planet--mercury" />
      </div>

      {/* Venus */}
      <div className="solar-orbit solar-orbit--2">
        <span className="solar-planet solar-planet--venus" />
      </div>

      {/* Earth */}
      <div className="solar-orbit solar-orbit--3">
        <span className="solar-planet solar-planet--earth" />
      </div>

      {/* Mars */}
      <div className="solar-orbit solar-orbit--4">
        <span className="solar-planet solar-planet--mars" />
      </div>

      {/* Jupiter */}
      <div className="solar-orbit solar-orbit--5">
        <span className="solar-planet solar-planet--jupiter" />
      </div>

      {/* Saturn */}
      <div className="solar-orbit solar-orbit--6">
        <span className="solar-planet solar-planet--saturn">
          <i className="solar-saturn-ring" />
        </span>
      </div>

      {/* Điểm Sáng — highlighted */}
      <div className="solar-orbit solar-orbit--7 solar-orbit--uranus">
        <div className="solar-planet solar-planet--uranus">
          <i className="solar-uranus-ring" />
          <i className="solar-uranus-glow" />
          <span className="solar-uranus-label">Điểm Sáng</span>
        </div>
      </div>

      {/* Neptune */}
      <div className="solar-orbit solar-orbit--8">
        <span className="solar-planet solar-planet--neptune" />
      </div>
    </div>
  );
};

export default SolarSystem;
