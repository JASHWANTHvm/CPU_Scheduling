function showAlgorithm() {
    const algorithm = document.getElementById('algorithm').value;
    let description = '';

    switch (algorithm) {
        case 'fcfs':
            description = 'First-Come, First-Served (FCFS) scheduling algorithm.';
            break;
        case 'sjf':
            description = 'Shortest Job First (SJF) scheduling algorithm.';
            break;
        case 'srtf':
            description = 'Shortest Remaining Time First (SRTF) scheduling algorithm.';
            break;
        case 'rr':
            description = 'Round Robin (RR) scheduling algorithm.';
            break;
        case 'priority':
            description = 'Priority-based scheduling algorithm.';
            break;
    }

    document.getElementById('algorithm-description').innerText = description;
}

function storeAndSimulate(event) {
    event.preventDefault();

    const algorithm = document.getElementById('algorithm').value;
    const burstsInput = document.getElementById('bursts').value;
    const arrivalInput = document.getElementById('arrivals').value;
    const prioritiesInput = document.getElementById('priorities').value;
    const quantumInput = document.getElementById('quantum').value;

    const bursts = burstsInput.split(',').map(Number);
    const arrivals = arrivalInput ? arrivalInput.split(',').map(Number) : Array(bursts.length).fill(0);
    const priorities = prioritiesInput ? prioritiesInput.split(',').map(Number) : [];
    const quantum = Number(quantumInput);

    let result;
    switch (algorithm) {
        case 'fcfs':
            result = fcfs(bursts, arrivals);
            break;
        case 'sjf':
            result = sjf(bursts, arrivals);
            break;
        case 'srtf':
            result = srtf(bursts, arrivals);
            break;
        case 'rr':
            result = roundRobin(bursts, arrivals, quantum);
            break;
        case 'priority':
            result = priorityScheduling(bursts, arrivals, priorities);
            break;
    }

    // Store the result in localStorage
    localStorage.setItem('simulationResult', JSON.stringify({
        avgWaitTime: result.avgWaitTime,
        avgTurnaroundTime: result.avgTurnaroundTime,
        ganttChartData: result.ganttChartData
    }));

    // Redirect to the results page
    window.location.href = 'result.html';
}


// Function to draw Gantt Chart
function drawGanttChart(ganttData) {
    const chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.marginTop = '20px';
    chartContainer.style.border = '1px solid #000';

    // Assign random colors to each process for better visualization
    const colors = {};
    ganttData.forEach(segment => {
        if (!colors[segment.process]) {
            colors[segment.process] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        }
    });

    // Append chart container to simulation-result element
    document.getElementById('simulation-result').appendChild(chartContainer);

    ganttData.forEach((segment, index) => {
        const block = document.createElement('div');
        block.style.flex = segment.duration;
        block.style.border = '1px solid black';
        block.style.padding = '10px';
        block.style.backgroundColor = colors[segment.process];
        block.style.color = 'white';
        block.style.opacity = '0';
        block.innerText = `P${segment.process} (${segment.start} - ${segment.end})`;

        // Apply animation with delay
        setTimeout(() => {
            block.style.opacity = '1';
            block.style.transition = 'opacity 0.5s ease-in';
            chartContainer.appendChild(block);  // Add each block after a delay
        }, index * 500);  // Delay each block by 500ms for sequential effect
    });

    // Generate the process flow in the format "P1 -> P2 -> ..."
    const processFlow = ganttData.map(segment => `P${segment.process}`).join(' -> ');

    // Create a new div to display the process flow
    const processFlowDiv = document.createElement('div');
    processFlowDiv.style.marginTop = '20px';
    processFlowDiv.style.fontWeight = 'bold';
    processFlowDiv.innerText = `Process Flow: ${processFlow}`;

    // Append the process flow div below the Gantt Chart
    document.getElementById('simulation-result').appendChild(processFlowDiv);
}



function displayResults() {
    const result = JSON.parse(localStorage.getItem('simulationResult'));

    if (result) {
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = `
            <h2>Average Wait Time: ${result.avgWaitTime}</h2>
            <h2>Average Turnaround Time: ${result.avgTurnaroundTime}</h2>
        `;

        // Draw the Gantt Chart
        drawGanttChart(result.ganttChartData);
    }
}

// Call displayResults when on the results page
if (window.location.pathname.includes('result.html')) {
    displayResults();
}

// First-Come, First-Served (FCFS)
function fcfs(bursts, arrivals) {
    let waitTime = 0, totalWaitTime = 0, turnaroundTime = 0, totalTurnaroundTime = 0;
    let time = 0;
    const ganttChartData = [];

    for (let i = 0; i < bursts.length; i++) {
        const start = time;
        time += bursts[i];
        ganttChartData.push({ process: i + 1, start, end: time, duration: bursts[i] });
        totalWaitTime += start - arrivals[i];
        totalTurnaroundTime += time - arrivals[i];
    }

    return {
        avgWaitTime: totalWaitTime / bursts.length,
        avgTurnaroundTime: totalTurnaroundTime / bursts.length,
        ganttChartData
    };
}

// Shortest Job First (SJF) - Non-Preemptive
function sjf(bursts, arrivals) {
    const ganttChartData = [];
    const n = bursts.length;
    let time = 0, completed = 0;
    const jobs = bursts.map((burst, i) => ({ burst, arrival: arrivals[i], index: i }));
    let totalWaitTime = 0, totalTurnaroundTime = 0;

    while (completed < n) {
        const availableJobs = jobs.filter(job => job.arrival <= time && !job.completed);
        if (availableJobs.length === 0) {
            time++;
            continue;
        }

        const nextJob = availableJobs.reduce((a, b) => (a.burst < b.burst ? a : b));
        nextJob.completed = true;
        const start = time;
        time += nextJob.burst;
        ganttChartData.push({ process: nextJob.index + 1, start, end: time, duration: nextJob.burst });

        const waitTime = start - nextJob.arrival;
        totalWaitTime += waitTime;
        totalTurnaroundTime += waitTime + nextJob.burst;
        completed++;
    }

    return {
        avgWaitTime: totalWaitTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        ganttChartData
    };
}

// Shortest Remaining Time First (SRTF) - Preemptive
function srtf(bursts, arrivals) {
    const ganttChartData = [];
    const remainingTimes = [...bursts];
    const n = bursts.length;
    let time = 0, completed = 0;
    let totalWaitTime = 0, totalTurnaroundTime = 0;

    while (completed < n) {
        const availableJobs = remainingTimes
            .map((remainingTime, i) => ({ remainingTime, index: i }))
            .filter(job => arrivals[job.index] <= time && remainingTime > 0);

        if (availableJobs.length === 0) {
            time++;
            continue;
        }

        const currentJob = availableJobs.reduce((a, b) => (a.remainingTime < b.remainingTime ? a : b));
        const start = time;
        time++;
        remainingTimes[currentJob.index]--;

        if (remainingTimes[currentJob.index] === 0) {
            const end = time;
            ganttChartData.push({ process: currentJob.index + 1, start, end, duration: end - start });
            completed++;
            const waitTime = end - bursts[currentJob.index] - arrivals[currentJob.index];
            totalWaitTime += waitTime;
            totalTurnaroundTime += end - arrivals[currentJob.index];
        }
    }

    return {
        avgWaitTime: totalWaitTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        ganttChartData
    };
}

// Round Robin (RR)
function roundRobin(bursts, arrivals, quantum) {
    const ganttChartData = [];
    const remainingBursts = [...bursts];
    const n = bursts.length;
    let time = 0, completed = 0;
    const waitTimes = Array(n).fill(0);
    let totalWaitTime = 0, totalTurnaroundTime = 0;
    const queue = Array.from({ length: n }, (_, i) => i);

    while (completed < n) {
        const i = queue.shift();

        if (remainingBursts[i] > 0 && arrivals[i] <= time) {
            const start = time;
            const executionTime = Math.min(quantum, remainingBursts[i]);
            remainingBursts[i] -= executionTime;
            time += executionTime;

            ganttChartData.push({ process: i + 1, start, end: time, duration: executionTime });

            if (remainingBursts[i] === 0) {
                completed++;
                const waitTime = time - bursts[i] - arrivals[i];
                totalWaitTime += waitTime;
                totalTurnaroundTime += time - arrivals[i];
            } else {
                queue.push(i);
            }
        } else if (arrivals[i] > time) {
            queue.push(i);
            time++;
        }
    }

    return {
        avgWaitTime: totalWaitTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        ganttChartData
    };
}

// Priority Scheduling
function priorityScheduling(bursts, arrivals, priorities) {
    const ganttChartData = [];
    const n = bursts.length;
    const jobs = bursts.map((burst, i) => ({
        burst,
        arrival: arrivals[i],
        priority: priorities[i],
        index: i
    }));
    let time = 0, completed = 0;
    let totalWaitTime = 0, totalTurnaroundTime = 0;

    while (completed < n) {
        const availableJobs = jobs.filter(job => job.arrival <= time && !job.completed);
        if (availableJobs.length === 0) {
            time++;
            continue;
        }

        const nextJob = availableJobs.reduce((a, b) => (a.priority < b.priority ? a : b));
        nextJob.completed = true;
        const start = time;
        time += nextJob.burst;
        ganttChartData.push({ process: nextJob.index + 1, start, end: time, duration: nextJob.burst });

        const waitTime = start - nextJob.arrival;
        totalWaitTime += waitTime;
        totalTurnaroundTime += waitTime + nextJob.burst;
        completed++;
    }

    return {
        avgWaitTime: totalWaitTime / n,
        avgTurnaroundTime: totalTurnaroundTime / n,
        ganttChartData
    };
}
