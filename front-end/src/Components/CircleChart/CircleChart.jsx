import "bootstrap/dist/css/bootstrap.min.css";
import { Row, Col } from "react-bootstrap";

const CircleChart = ({
  data,
  thickness = 12,
  gapSize = 4,
  grams,
  onGramsChange,
}) => {
  const scaledData = data.map((item) => ({
    ...item,
    scaledValue: (item.value * grams) / 100,
  }));

  const nonZeroData = scaledData.filter((item) => item.scaledValue > 0);
  const totalGrams = nonZeroData.reduce(
    (acc, item) => acc + item.scaledValue,
    0
  );

  const calculateCalories = (nutrient) => {
    const multiplier = nutrient.label === "Fats" ? 9 : 4;
    return nutrient.scaledValue * multiplier;
  };
  const totalCalories = scaledData.reduce(
    (acc, item) => acc + calculateCalories(item),
    0
  );

  const radius = 90 - thickness / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  return (
    <div className='text-center'>
      <div className='mb-4 d-flex justify-content-center flex-column align-items-center'>
        <label className='form-label'>Serving Size (grams)</label>
        <input
          type='number'
          className='form-control text-center'
          value={grams}
          onChange={(e) =>
            onGramsChange(Math.max(0, e.target.valueAsNumber || 100))
          }
          min='0'
          step='1'
          style={{ maxWidth: "200px", margin: "0 auto" }}
        />
      </div>

      <div
        className='position-relative mx-auto mb-2'
        style={{ width: "200px", height: "200px" }}
      >
        <svg width='200' height='200' viewBox='0 0 200 200'>
          {nonZeroData.map((item, index) => {
            const segmentLength =
              (item.scaledValue / totalGrams) * circumference;
            const dashArray = `${segmentLength - gapSize} ${
              circumference - segmentLength + gapSize
            }`;
            const rotation = (accumulatedLength / circumference) * 360 - 90;

            accumulatedLength += segmentLength;

            return (
              <circle
                key={index}
                cx='100'
                cy='100'
                r={radius}
                fill='none'
                stroke={item.color}
                strokeWidth={thickness}
                strokeLinecap='round'
                strokeDasharray={dashArray}
                transform={`rotate(${rotation} 100 100)`}
              />
            );
          })}
        </svg>

        <div className='position-absolute top-50 start-50 translate-middle text-center'>
          <div className='fontcustom fw-bold'>
            {totalCalories.toFixed(0)} kcal
          </div>
        </div>
      </div>

      <Row className=' justify-content-center'>
        {scaledData.map((item, index) => {
          return (
            <Col key={index} className='col-auto mb-2'>
              <div className='d-flex align-items-center'>
                <div
                  className='color-box me-2'
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: item.color,
                    borderRadius: "4px",
                    opacity: item.scaledValue > 0 ? 1 : 0.5,
                  }}
                ></div>
                <div>
                  <div className='small mb-0'>
                    {item.label}: {item.scaledValue.toFixed(1)}g
                  </div>
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default CircleChart;
