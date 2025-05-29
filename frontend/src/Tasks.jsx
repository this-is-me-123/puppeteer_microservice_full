import React, { useEffect, useState } from "react";

export default function Tasks() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    const token = localStorage.getItem("token");
    fetch("/api/queue", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
    const id = setInterval(fetchJobs, 10000);
    return () => clearInterval(id);
  }, []);

  const retry = (id) => {
    const token = localStorage.getItem("token");
    fetch(`/api/queue/${id}/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => fetchJobs());
  };

  if (loading) return <p>Loading jobs…</p>;

  return (
    <div>
      <h2>Job Queue</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Folder</th><th>Status</th><th>Created</th><th>Updated</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{job.folder}</td>
              <td>{job.status}</td>
              <td>{new Date(job.created_at).toLocaleString()}</td>
              <td>{new Date(job.updated_at).toLocaleString()}</td>
              <td>
                {job.status === "failed" && (
                  <button onClick={() => retry(job.id)}>Retry</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
