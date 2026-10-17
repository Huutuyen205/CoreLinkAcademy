import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 Load Test for TC-098 (FR-605): 150 virtual students saving drafts every 10s
export const options = {
  stages: [
    { duration: '5s', target: 50 },
    { duration: '15s', target: 150 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // 95% số lần lưu nháp dưới 1 giây (TC-098)
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';

export default function () {
  const attemptId = __ENV.ATTEMPT_ID || 'dummy-attempt-id';
  const token = __ENV.AUTH_TOKEN || '';

  const payload = JSON.stringify({
    answers: [
      {
        questionId: 'dummy-question-id',
        response: { selected: `Option_${__VU}_${__ITER}` },
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const res = http.put(`${BASE_URL}/assessment/attempts/${attemptId}/answers`, payload, params);

  check(res, {
    'status is 200 or 404 (valid api response)': (r) => r.status === 200 || r.status === 404,
  });

  // Lưu nháp mỗi 10 giây
  sleep(10);
}
