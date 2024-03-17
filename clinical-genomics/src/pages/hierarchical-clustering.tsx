import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/HierarchicalClustering.module.css';

import { useEffect } from 'react';
import * as d3 from 'd3';


function graph(root: any, {
  label = d => d.data.id, 
  highlight = () => false,
  marginLeft = 40
} = {}) {
  const dx = 12;
  const dy = 120;
  const width = 600;
  const tree = d3.tree().nodeSize([dx, dy]);
  root = tree(root);

  let x0 = Infinity;
  let x1 = -x0;
  root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const cluster = d3.select('#cluster');
  const svg = cluster.append("svg")
      .attr("viewBox", [0, 200, width, x1 - x0 + dx * 2])
      .style("overflow", "visible");
  
  const g = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("transform", `translate(${marginLeft},${dx - x0})`);
  
  const treeLink = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  const link = g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
  .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("stroke", d => highlight(d.source) && highlight(d.target) ? "red" : null)
      .attr("stroke-opacity", d => highlight(d.source) && highlight(d.target) ? 1 : null)
      .attr("d", treeLink);
  
  const node = g.append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants())
    .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

  console.log(node);

  node.append("circle")
      .attr("fill", d => highlight(d) ? "red" : d.children ? "#555" : "#999")
      .attr("r", 2.5);

  node.append("text")
      .attr("fill", d => highlight(d) ? "red" : null)
      .attr("stroke", "black")
      .attr("stroke-width", 0)
      .attr("dy", "0.1em")
      .attr("x", d => d.children ? -6 : 6)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .style('text-rendering', 'optimizeLegibility')
      .text((d) => {
        console.log(d);
        return d.data.name;
      });
  
  return svg.node();
}

export default function HierarchicalClustering() {
    
    useEffect(() => {
      d3.selectAll("svg").remove();
      const family = d3.hierarchy({
        name: "root",
        children: [
          {name: "child #1"},
          {
            name: "child #2",
            children: [
              {name: "grandchild #1"},
              {name: "grandchild #2"},
              {name: "grandchild #3"}
            ]
          }
        ]
      });
      const g = graph(family);
    }, []);

  const data = {'test': true};
  
  const handleButtonClick = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/h-clustering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: data }),
      });

      if (response.ok) {
        const result = await response.json();
      } else {
        alert('Failed to send data');
      }
    } catch (error) {
      console.error('Error sending data:', error);
      alert('Error sending data. See console for details.');
    }
  };
  
  return (
    <div>
      <Head>
        <title>Hierarchical Clustering</title>
        <meta name="description" content="Explore hierarchical clustering in clinical genomic datasets." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Hierarchical Clustering</h1>
        <button id="run-clustering-btn" onClick={handleButtonClick}>Run Clustering</button>
      </main>

      <div id="cluster"></div>
    </div>
  );
}