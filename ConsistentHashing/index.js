const crypto = require('crypto');

class ConsistentHashing {
    constructor(replicas = 3) {
        this.replicas = replicas; // Number of virtual nodes per real node
        this.ring = new Map(); // Stores hash -> node mapping
        this.sortedHashes = []; // List of sorted hashes
    }

    // Hash function using SHA-256
    _hash(value) {
        return parseInt(
            crypto.createHash('sha256').update(value).digest('hex').slice(0, 8),
            16
        );
    }

    // Add a node with replicas to the ring
    addNode(node) {
        for (let i = 0; i < this.replicas; i++) {
            const hash = this._hash(`${node}-${i}`);
            this.ring.set(hash, node);
            this.sortedHashes.push(hash);
        }
        this.sortedHashes.sort((a, b) => a - b); // Keep the hashes sorted
    }

    // Remove a node from the ring
    removeNode(node) {
        for (let i = 0; i < this.replicas; i++) {
            const hash = this._hash(`${node}-${i}`);
            this.ring.delete(hash);
            const index = this.sortedHashes.indexOf(hash);
            if (index !== -1) {
                this.sortedHashes.splice(index, 1);
            }
        }
    }

    // Get the node responsible for a given key
    getNode(key) {
        if (this.sortedHashes.length === 0) {
            return null;
        }

        const hash = this._hash(key);
        // Find the first hash greater than or equal to the key hash
        for (let i = 0; i < this.sortedHashes.length; i++) {
            if (hash <= this.sortedHashes[i]) {
                return this.ring.get(this.sortedHashes[i]);
            }
        }
        // If no hash is greater, wrap around to the first hash
        return this.ring.get(this.sortedHashes[0]);
    }
}

// Example usage
const ch = new ConsistentHashing();

ch.addNode('NodeA');
ch.addNode('NodeB');
ch.addNode('NodeC');

console.log('Node for Key1:', ch.getNode('Key1'));
console.log('Node for Key2:', ch.getNode('Key2'));

ch.removeNode('NodeB');
console.log('After removing NodeB:');
console.log('Node for Key1:', ch.getNode('Key1'));
console.log('Node for Key2:', ch.getNode('Key2'));
