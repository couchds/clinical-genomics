import random
import string
import os

import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs
from sklearn.cluster import AgglomerativeClustering
from scipy.cluster.hierarchy import dendrogram, to_tree, linkage
from sklearn.neighbors import kneighbors_graph
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

host = os.getenv('DB_HOST', 'default_host')
user = os.getenv('DB_USER', 'default_user')
password = os.getenv('DB_PASSWORD', 'default_password')
database = os.getenv('DB_NAME', 'default_db')

DB_CONFIG = {
    'host': host,
    'user': user,
    'password': password,
    'database': database
}

def create_distance_matrix():
    """ Create distance matrix between all samples.
    NOTE: Not including mutation info at the moment
    """
    conn = mysql.connector.connect(**DB_CONFIG)
    query = "SELECT SampleName, Hugo_Symbol FROM TCGA2015 WHERE RSEM_Zscore>3 AND CNA>2 AND oncokbAnnotated is true"
    print(query)
    cursor = conn.cursor(dictionary=True)
    cursor.execute(query)
    rows = cursor.fetchall()
    print(rows)
    sample_geneset_map = {}
    for row in rows:
        samplename = row['SampleName']
        if samplename not in sample_geneset_map:
            sample_geneset_map[samplename] = set([row['Hugo_Symbol']])
        else:
            sample_geneset_map[samplename].add(row['Hugo_Symbol'])
    
    adjacency_list = {}
    for sample1 in sample_geneset_map:
        adjacency_list[sample1] = {}
        sample1_geneset = sample_geneset_map[sample1]
        for sample2 in sample_geneset_map:
            sample2_geneset = sample_geneset_map[sample2]
            intersection = sample1_geneset.intersection(sample2_geneset)
            union = sample1_geneset.union(sample2_geneset)
            proportion_union = len(intersection) / len(union)
            adjacency_list[sample1][sample2] = proportion_union
    
    return adjacency_list
    #return set(rows)

adj_list = create_distance_matrix()

# Extract unique nodes and sort them to ensure consistent ordering
nodes = sorted(adj_list.keys())

# Initialize an empty adjacency matrix
adjacency_matrix = np.zeros((len(nodes), len(nodes)))

# Fill the adjacency matrix with values from the adjacency list
for i, node_i in enumerate(nodes):
    for j, node_j in enumerate(nodes):
        adjacency_matrix[i, j] = adj_list[node_i].get(node_j, 0)  # Use .get() to handle missing entries

print("Adjacency Matrix:")
print(adjacency_matrix)

Z = linkage(adjacency_matrix, 'single')  # 'single' linkage; you might choose another

# Plot dendrogram
plt.figure(figsize=(10, 7))
dendrogram(Z, labels=nodes)
plt.title("Hierarchical Clustering Dendrogram")
plt.xlabel("Nodes")
plt.ylabel("Distance")
plt.show()



# Generate a sample dataset
X, labels_true = make_blobs(n_samples=20, centers=3, cluster_std=0.60, random_state=0)

def generate_random_string(length=5):
    """Generate a random string of fixed length."""
    letters = string.ascii_letters  # Includes both lowercase and uppercase letters
    return ''.join(random.choice(letters) for i in range(length))

# Generate a random label for each point in the dataset
labels = [generate_random_string() for _ in range(X.shape[0])]
labeled_points = list(zip(X, labels))

# Create the model: using Ward linkage method
model = AgglomerativeClustering(n_clusters=3, linkage='ward')

# Fit model to data
model.fit(X)

# Optionally, compute the linkage matrix to plot dendrogram, using scikit-learn's connectivity matrix
connectivity = kneighbors_graph(X, n_neighbors=10, include_self=False)
connectivity = 0.5 * (connectivity + connectivity.T)

model_with_connectivity = AgglomerativeClustering(n_clusters=3, linkage='ward', connectivity=connectivity)
model_with_connectivity.fit(X)

# Plot the clusters
plt.scatter(X[:, 0], X[:, 1], c=model.labels_, cmap='rainbow', alpha=0.7, edgecolors='b')
plt.title("Hierarchical Clustering")
plt.xlabel("Feature 0")
plt.ylabel("Feature 1")
plt.show()
plt.savefig('output1.png')

# Plot dendrogram (optional, for illustrative purposes)
# This requires computing the full linkage tree and using scipy
from scipy.cluster.hierarchy import ward, dendrogram

# Compute the full tree
linkage_matrix = ward(X)
d = dendrogram(linkage_matrix)

rootnode, nodelist = to_tree(linkage_matrix, rd=True)
def add_node(node, parent):
    newNode = dict(node_id=node.id, children=[])
    if node.is_leaf():
        newNode['leaf'] = True
        newNode['obs_id'] = node.id
    else:
        newNode['leaf'] = False
        newNode['children'] = [add_node(nodelist[child_id], newNode) for child_id in [node.left.id, node.right.id]]
    if not node.is_leaf():
        newNode['distance'] = node.dist
        newNode['count'] = node.count
    return newNode

#print(add_node(rootnode, None))

# Build the dictionary from the root node
dendrogram_dict = add_node(rootnode, None)

plt.title("Hierarchical Clustering Dendrogram")
plt.xlabel("Sample index")
plt.ylabel("Cluster distance")
plt.show()
plt.savefig('output.png')