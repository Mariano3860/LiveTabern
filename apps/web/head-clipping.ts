import { Object3D, Plane, Vector3 } from 'three';

export function bindHeadClip(head: Object3D) {
  head.updateWorldMatrix(true, false);
  const local = new Plane(new Vector3(0, 1, 0), -1.53).applyMatrix4(head.matrixWorld.clone().invert());
  const plane = new Plane();
  const update = () => {
    head.updateWorldMatrix(true, false);
    plane.copy(local).applyMatrix4(head.matrixWorld);
  };
  update();
  return { plane, update };
}
