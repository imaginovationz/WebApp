import React, { useEffect, useState } from 'react';
import axios from 'axios';
import frontendconfig from '../../src/frontendconfig';

const TaskEntry = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    axios.get(`${frontendconfig.backendUrl}/tasks`)
      .then(response => {
        setTasks(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the tasks!', error);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newTask = { title, description, status };
    axios.post(`${frontendconfig.backendUrl}/tasks`, newTask)
      .then(response => {
        setTasks([...tasks, response.data]);
        setTitle('');
        setDescription('');
        setStatus('');
      })
      .catch(error => {
        console.error('There was an error adding the task!', error);
      });
  };

  return (
    <div>
      <h1>Task Entry</h1>

      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Description:</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Status:</label>
          <input type="text" value={status} onChange={(e) => setStatus(e.target.value)} required />
        </div>
        <button type="submit">Add Task</button>
      </form>

      <h2>Inserted task is</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <p>Status: {task.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskEntry;