
import Head from 'next/head';
import styles from '../styles/GraphAnalysis.module.css';

import { useEffect, useState } from 'react';
import * as d3 from 'd3';


export default function GraphAnalysis() {

  const [oncogeneList, setOncogeneList] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [rsemzValue, setRsemzValue] = useState('');
  const [cnaValue, setCnaValue] = useState('');
  
  const handleNodeClick = async (d) => {
    console.log(d);
    const response = await fetch(`http://localhost:5000/api/functional-oncogenes?sample=${d.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    const responseJson = await response.json();
    let oncogeneListContent = '';
    let i = 0;
    for (const value of responseJson) {
      if (i === 0) oncogeneListContent = value['Hugo_Symbol'];
      if (i > 0) {
        oncogeneListContent = oncogeneListContent + ', ' + value['Hugo_Symbol'];
      }
      i += 1;
    }
    setOncogeneList(oncogeneListContent);
    setSampleName(d.id);
  }

  const graph = (data) => {

    // Specify the dimensions of the chart.
    const width = 1400;
    const height = 500;
  
    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);
  
    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = data.links.map(d => ({...d}));
    const nodes = data.nodes.map(d => ({...d}));
  
    // Create a simulation with several forces.
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX())
        .force("y", d3.forceY());
  
    const cluster = d3.select('#cluster');
    // Create the SVG container.
    const svg = cluster.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");
  
    // Add a line for each link, and a circle for each node.
    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));
  
    let selectedNode = null;

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .attr("fill", d => color(d.group))
        .on("click", (event, d) => {
          handleNodeClick(d);
          if (selectedNode === d.id) {
            selectedNode = null; // Deselect if the same node is clicked
          } else {
              selectedNode = d.id; // Select the node
          }
          node.attr('fill', n => n.id === selectedNode ? 'red' : color(d.group));
        });
  
    node.append("title")
        .text(d => d.id);
  
    // Add a drag behavior.
    node.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
    
    // Set the position attributes of links and nodes each time the simulation ticks.
    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);
  
      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    });
  
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    // Update the subject (dragged node) position during drag.
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  
    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());
    console.log('here');
    // return svg.node();
  }
  


  const handleButtonClick = async () => {
    d3.selectAll("svg").remove();
    try {
      const response = await fetch('http://localhost:5000/api/distance-matrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rsemz: rsemzValue, cna: cnaValue }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result);
        const data = {nodes: [], links: []};
 
        // first pass: build nodes
        for (const item of Object.keys(result)) {
          if ( Object.keys(result[item]).length !== 0) {
            data['nodes'].push({'id': item});
          }
        }
        // second pass: build links
        for (const item of Object.keys(result)) {
          for (const sample2 of Object.keys(result[item])) {
            data['links'].push({
              'source': item,
              'target': sample2
            })
          }
        }

        console.log(data);

        graph(data);
      } else {
        alert('Failed to send data');
      }
    } catch (error) {
      console.error('Error sending data:', error);
      alert('Error sending data. See console for details.');
    }
  };

  const handleRsemzChange = (e) => {
    setRsemzValue(e.target.value);
  };
  
  const handleCnaChange = (e) => {
    setCnaValue(e.target.value);
  };
  
  return (
    <div>
      <Head>
        <title>Graph Analysis</title>
        <meta name="description" content="Explore hierarchical clustering in clinical genomic datasets." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Graph Analysis</h1>
        
        <div className={styles.formContainer}>
          <label htmlFor="inputField" className={styles.inputLabel}>RSEM Z-score</label>
          <input
            type="text"
            value={rsemzValue}
            onChange={handleRsemzChange}
            className={styles.inputField}
          />

          <label htmlFor="inputField" className={styles.inputLabel}>CNA</label>
          <input
            type="text"
            value={cnaValue}
            onChange={handleCnaChange}
            className={styles.inputField}
          />
        </div>

        <button id="run-clustering-btn" className={styles.submitButton} onClick={handleButtonClick}>Run Clustering</button>

        <br></br>
        <div style={{marginLeft: '20vw', fontFamily: 'arial'}} id="selected-sample">{sampleName}: <br /><br /> { oncogeneList }</div>
        <div id="cluster"></div>
      </main>
    </div>
  );
}
