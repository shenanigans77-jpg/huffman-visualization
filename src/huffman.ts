import init from './c/huffman.wasm';
import { unmarshalNode, Node } from './node';

interface HuffmanExports {
	memory: WebAssembly.Memory;
	build_tree: (hist: number) => number;
	malloc: (n: number) => number;
	calloc: (n: number, size: number) => number;
}

export type Path = (0|1)[];

export async function buildTree(hist: Map<number, number>): Promise<Node> {
	const exports = await init({ imports: {} }) as unknown as HuffmanExports;
	// allocate array to store histogram (256x uint32_t)
	const ptr = exports.calloc(256, 4),
		u32 = new Uint32Array(exports.memory.buffer, ptr, 256);

	for (let i = 0; i < 256; i += 1) {
		u32[i] = hist.get(i) ?? 0;
	}

	const treePtr = exports.build_tree(ptr);
	return unmarshalNode(exports.memory.buffer, treePtr);
}

export function getTreeDepth(root: Node): number {
	if (root.left && root.right) {
		return 1 + Math.max(getTreeDepth(root.left), getTreeDepth(root.right));
	} else if (root.left) {
		return 1 + getTreeDepth(root.left);
	} else if (root.right) {
		return 1 + getTreeDepth(root.right);
	} else {
		return 1;
	}
}

export function getNodeX(path: Path): number {
	let x = 0.5;
	for (const i in path) {
		const step = path[i];
		if (step == 0) {
			// left
			x -= 2 ** (-i - 2);
		} else {
			// right
			x += 2 ** (-i - 2);
		}
	}

	return x;
}

export function* inOrderTraverse(root: Node, basePath: Path = []): Generator<[Node, Path]> {
	if (root.left) {
		yield* inOrderTraverse(root.left, [...basePath, 0]);
	}
	yield [root, basePath];
	if (root.right) {
		yield* inOrderTraverse(root.right, [...basePath, 1]);
	}
}
