"""Create, validate, and export a low-poly sitting brown bear."""

from pathlib import Path
import math

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = REPO_ROOT / "assets" / "blender" / "sitting_bear.blend"
PREVIEW_DIR = REPO_ROOT / "assets" / "blender" / "previews"
GLB_PATH = REPO_ROOT / "web-app" / "public" / "models" / "forest" / "sitting_bear.glb"


def ensure_output_directories():
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def make_material(name, color, roughness=0.9):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1.0)
    shader.inputs["Roughness"].default_value = roughness
    return material


def move_to_collection(obj, collection):
    for current_collection in list(obj.users_collection):
        current_collection.objects.unlink(obj)
    collection.objects.link(obj)


def add_low_poly_sphere(collection, parent, name, location, scale, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=16,
        ring_count=8,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(material)
    obj.parent = parent
    move_to_collection(obj, collection)
    return obj


def add_bear():
    bear_collection = bpy.data.collections.new("SittingBear")
    bpy.context.scene.collection.children.link(bear_collection)

    root = bpy.data.objects.new("BearRoot", None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.35
    root["asset_type"] = "sitting_low_poly_bear"
    root["forward_axis"] = "-Y"
    bear_collection.objects.link(root)

    fur = make_material("Fur_Warm_Brown", (0.22, 0.095, 0.035), 0.96)
    fur_mid = make_material("Fur_Mid_Brown", (0.28, 0.13, 0.055), 0.96)
    fur_dark = make_material("Fur_Dark_Brown", (0.11, 0.04, 0.015), 0.98)
    muzzle = make_material("Muzzle_Brown", (0.32, 0.18, 0.08), 0.96)
    features = make_material("Eyes_And_Nose", (0.018, 0.012, 0.008), 0.8)
    claw = make_material("Claws_Muted", (0.24, 0.2, 0.14), 0.9)

    parts = []
    parts.append(add_low_poly_sphere(
        bear_collection, root, "Body",
        (0, 0.1, 1.6), (1.36, 1.0, 1.5), fur,
        rotation=(0, 0, math.radians(2)),
    ))
    parts.append(add_low_poly_sphere(
        bear_collection, root, "Shoulders",
        (0.04, -0.02, 2.38), (1.42, 0.94, 0.76), fur_mid,
        rotation=(0, 0, math.radians(-2)),
    ))

    head_pivot = bpy.data.objects.new("HeadPivot", None)
    head_pivot.empty_display_type = "PLAIN_AXES"
    head_pivot.empty_display_size = 0.2
    head_pivot.location = (0.04, -0.05, 3.5)
    head_pivot.rotation_euler.z = math.radians(-7)
    head_pivot.parent = root
    bear_collection.objects.link(head_pivot)

    parts.append(add_low_poly_sphere(
        bear_collection, head_pivot, "Head",
        (0, 0, 0), (1.02, 0.98, 0.72), fur,
    ))
    parts.append(add_low_poly_sphere(
        bear_collection, head_pivot, "Muzzle",
        (0, -0.98, -0.12), (0.68, 0.58, 0.31), muzzle,
    ))
    parts.append(add_low_poly_sphere(
        bear_collection, head_pivot, "Nose",
        (0, -1.5, -0.1), (0.16, 0.1, 0.11), features,
    ))

    for side in (-1, 1):
        side_name = "Left" if side < 0 else "Right"
        ear_scale = (0.24, 0.14, 0.2) if side < 0 else (0.21, 0.13, 0.19)
        parts.append(add_low_poly_sphere(
            bear_collection, head_pivot, f"Ear_{side_name}",
            (0.72 * side, 0.02, 0.58), ear_scale, fur_dark,
            rotation=(math.radians(8 * side), 0, math.radians(10 * side)),
        ))
        parts.append(add_low_poly_sphere(
            bear_collection, head_pivot, f"Eye_{side_name}",
            (0.32 * side, -0.87, 0.29), (0.052, 0.035, 0.052), features,
        ))

        front_x = -0.65 if side < 0 else 0.7
        front_y = -0.58 if side < 0 else -0.52
        front_z = 1.48 if side < 0 else 1.54
        arm_rotation = (0, math.radians(5 * side), math.radians(-5 * side))
        parts.append(add_low_poly_sphere(
            bear_collection, root, f"FrontLeg_{side_name}",
            (front_x, front_y, front_z), (0.43, 0.47, 0.96), fur_dark, arm_rotation,
        ))
        paw_x = -0.52 if side < 0 else 0.6
        paw_y = -0.82 if side < 0 else -0.72
        paw_z = 0.4 if side < 0 else 0.44
        parts.append(add_low_poly_sphere(
            bear_collection, root, f"FrontPaw_{side_name}",
            (paw_x, paw_y, paw_z), (0.38, 0.5, 0.28), fur_dark,
        ))

        hind_x = -0.98 if side < 0 else 1.04
        parts.append(add_low_poly_sphere(
            bear_collection, root, f"HindLeg_{side_name}",
            (hind_x, 0.08, 0.68), (0.78, 0.77, 0.67), fur_mid,
        ))
        hind_paw_x = -1.0 if side < 0 else 1.1
        hind_paw_y = -0.62 if side < 0 else -0.55
        parts.append(add_low_poly_sphere(
            bear_collection, root, f"HindPaw_{side_name}",
            (hind_paw_x, hind_paw_y, 0.3), (0.7, 0.86, 0.3), fur_dark,
        ))

        for claw_index in (-1, 0, 1):
            parts.append(add_low_poly_sphere(
                bear_collection, root, f"Claw_{side_name}_{claw_index + 2}",
                (
                    hind_paw_x + claw_index * 0.18,
                    hind_paw_y - 0.78,
                    0.24,
                ),
                (0.055, 0.13, 0.045), claw,
                rotation=(math.radians(8), 0, 0),
            ))

    parts.append(add_low_poly_sphere(
        bear_collection, root, "Tail",
        (-0.28, 0.94, 1.02), (0.3, 0.25, 0.3), fur_mid,
    ))

    for part in parts:
        part["bear_part"] = part.name

    return bear_collection, root


def export_glb(bear_collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bear_collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = bear_collection.objects.get("BearRoot")
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
    )


def point_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_preview_setup():
    preview_collection = bpy.data.collections.new("PreviewOnly")
    bpy.context.scene.collection.children.link(preview_collection)

    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    ground = bpy.context.object
    ground.name = "PreviewGround"
    move_to_collection(ground, preview_collection)
    ground.data.materials.append(make_material("PreviewGroundMaterial", (0.055, 0.07, 0.05)))

    bpy.ops.object.light_add(type="AREA", location=(-4.5, -5.5, 7.0))
    key = bpy.context.object
    key.name = "PreviewKey"
    key.data.energy = 900
    key.data.shape = "DISK"
    key.data.size = 5.0
    point_at(key, (0, 0, 2))
    move_to_collection(key, preview_collection)

    bpy.ops.object.light_add(type="AREA", location=(4.0, -2.0, 4.5))
    fill = bpy.context.object
    fill.name = "PreviewFill"
    fill.data.energy = 500
    fill.data.size = 4.0
    point_at(fill, (0, 0, 2))
    move_to_collection(fill, preview_collection)

    bpy.ops.object.light_add(type="AREA", location=(0, 3.5, 5.5))
    rim = bpy.context.object
    rim.name = "PreviewRim"
    rim.data.energy = 650
    rim.data.size = 3.0
    point_at(rim, (0, 0, 2.3))
    move_to_collection(rim, preview_collection)

    bpy.ops.object.camera_add(location=(0, -9.2, 3.0))
    camera = bpy.context.object
    camera.name = "PreviewCamera"
    camera.data.lens = 62
    point_at(camera, (0, 0, 2.1))
    move_to_collection(camera, preview_collection)
    bpy.context.scene.camera = camera
    return camera


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.world.color = (0.025, 0.035, 0.025)
    scene.view_settings.look = "AgX - Medium High Contrast"


def render_validation_views(camera):
    views = {
        "sitting_bear_front.png": ((0, -9.2, 3.0), (0, 0, 2.05)),
        "sitting_bear_three_quarter.png": ((6.2, -7.4, 3.5), (0, 0, 2.0)),
    }
    for filename, (location, target) in views.items():
        camera.location = location
        point_at(camera, target)
        bpy.context.scene.render.filepath = str(PREVIEW_DIR / filename)
        bpy.ops.render.render(write_still=True)


def main():
    ensure_output_directories()
    reset_scene()
    bear_collection, _root = add_bear()
    export_glb(bear_collection)
    camera = add_preview_setup()
    configure_render()
    render_validation_views(camera)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved Blender source: {BLEND_PATH}")
    print(f"Exported GLB: {GLB_PATH}")
    print(f"Saved validation renders: {PREVIEW_DIR}")


if __name__ == "__main__":
    main()
