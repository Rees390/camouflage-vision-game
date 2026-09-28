"""Create, validate, and export a low-poly adult wild doe."""

from pathlib import Path
import math

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = REPO_ROOT / "assets" / "blender" / "wild_deer.blend"
PREVIEW_DIR = REPO_ROOT / "assets" / "blender" / "previews"
GLB_PATH = REPO_ROOT / "web-app" / "public" / "models" / "forest" / "wild_deer.glb"


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


def make_material(name, color, roughness=0.96):
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


def finish_mesh(obj, collection, parent, material):
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(material)
    obj.parent = parent
    move_to_collection(obj, collection)
    obj["deer_part"] = obj.name
    return obj


def add_sphere(collection, parent, name, location, scale, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=14,
        ring_count=7,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, collection, parent, material)


def add_cone(collection, parent, name, location, scale, rotation, material):
    bpy.ops.mesh.primitive_cone_add(
        vertices=6,
        radius1=1.0,
        radius2=0.0,
        depth=2.0,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, collection, parent, material)


def add_leg_segment(collection, parent, name, start, end, radius, material):
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    midpoint = (start_vector + end_vector) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=7,
        radius=radius,
        depth=direction.length,
        location=midpoint,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    return finish_mesh(obj, collection, parent, material)


def add_deer():
    deer_collection = bpy.data.collections.new("WildDeer")
    bpy.context.scene.collection.children.link(deer_collection)

    root = bpy.data.objects.new("DeerRoot", None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.3
    root["asset_type"] = "low_poly_wild_doe"
    root["forward_axis"] = "+X"
    deer_collection.objects.link(root)

    fur = make_material("Fur_Reddish_Brown", (0.27, 0.105, 0.035))
    fur_mid = make_material("Fur_Earthy_Brown", (0.2, 0.07, 0.022))
    fur_dark = make_material("Fur_Shadow_Brown", (0.11, 0.035, 0.012))
    fur_light = make_material("Fur_Underside", (0.38, 0.19, 0.08))
    features = make_material("Eyes_And_Nose", (0.012, 0.009, 0.007), 0.82)
    hooves = make_material("Hooves", (0.035, 0.025, 0.02), 0.98)

    parts = []
    parts.append(add_sphere(
        deer_collection, root, "Body",
        (0, 0, 1.88), (1.42, 0.5, 0.7), fur,
        rotation=(0, math.radians(-2), 0),
    ))
    parts.append(add_sphere(
        deer_collection, root, "Rump",
        (-0.82, 0, 1.98), (0.72, 0.52, 0.68), fur_mid,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Shoulders",
        (0.78, 0, 2.02), (0.62, 0.47, 0.65), fur,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Underbody",
        (-0.05, -0.01, 1.4), (1.05, 0.49, 0.16), fur_light,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Neck",
        (0.9, 0, 2.75), (0.42, 0.37, 1.0), fur_mid,
        rotation=(0, math.radians(24), 0),
    ))
    parts.append(add_sphere(
        deer_collection, root, "Head",
        (1.43, -0.01, 3.5), (0.68, 0.36, 0.42), fur,
        rotation=(0, math.radians(-4), 0),
    ))
    parts.append(add_sphere(
        deer_collection, root, "Muzzle",
        (1.92, -0.01, 3.38), (0.55, 0.27, 0.24), fur_light,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Nose",
        (2.34, -0.01, 3.37), (0.12, 0.16, 0.12), features,
    ))

    parts.append(add_cone(
        deer_collection, root, "Ear_Near",
        (1.22, -0.28, 3.98), (0.19, 0.15, 0.42),
        (math.radians(-14), math.radians(-10), math.radians(-8)), fur_mid,
    ))
    parts.append(add_cone(
        deer_collection, root, "Ear_Far",
        (1.13, 0.27, 4.02), (0.18, 0.14, 0.38),
        (math.radians(12), math.radians(12), math.radians(9)), fur_mid,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Eye_Near",
        (1.58, -0.34, 3.61), (0.052, 0.035, 0.052), features,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Eye_Far",
        (1.58, 0.34, 3.61), (0.052, 0.035, 0.052), features,
    ))
    parts.append(add_sphere(
        deer_collection, root, "Tail",
        (-1.43, 0.02, 2.16), (0.22, 0.16, 0.28), fur_light,
        rotation=(0, math.radians(-18), 0),
    ))

    legs = [
        ("FrontNear", (0.78, -0.34, 1.7), (0.8, -0.34, 0.9), (0.9, -0.34, 0.18)),
        ("FrontFar", (0.52, 0.3, 1.66), (0.45, 0.3, 0.88), (0.38, 0.3, 0.18)),
        ("RearNear", (-0.82, -0.34, 1.62), (-0.62, -0.34, 0.86), (-0.78, -0.34, 0.18)),
        ("RearFar", (-1.02, 0.3, 1.58), (-1.13, 0.3, 0.84), (-1.03, 0.3, 0.18)),
    ]
    for name, hip, joint, ankle in legs:
        leg_material = fur_mid if "Near" in name else fur_dark
        parts.append(add_leg_segment(
            deer_collection, root, f"{name}_Upper", hip, joint, 0.12, leg_material,
        ))
        parts.append(add_sphere(
            deer_collection, root, f"{name}_Joint",
            joint, (0.11, 0.1, 0.11), leg_material,
        ))
        parts.append(add_leg_segment(
            deer_collection, root, f"{name}_Lower", joint, ankle, 0.085, leg_material,
        ))
        hoof_x = ankle[0] + 0.09
        parts.append(add_sphere(
            deer_collection, root, f"{name}_Hoof",
            (hoof_x, ankle[1], 0.075), (0.17, 0.11, 0.075), hooves,
        ))

    return deer_collection, root


def export_glb(deer_collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in deer_collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = deer_collection.objects.get("DeerRoot")
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

    for name, location, energy, size in (
        ("PreviewKey", (-4.5, -5.5, 7), 900, 5),
        ("PreviewFill", (4, -2, 4.5), 500, 4),
        ("PreviewRim", (0, 3.5, 5.5), 650, 3),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        point_at(light, (0.2, 0, 2))
        move_to_collection(light, preview_collection)

    bpy.ops.object.camera_add(location=(0, -8.5, 2.5))
    camera = bpy.context.object
    camera.name = "PreviewCamera"
    camera.data.lens = 62
    point_at(camera, (0.2, 0, 2))
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
    scene.world.color = (0.025, 0.035, 0.025)
    scene.view_settings.look = "AgX - Medium High Contrast"


def render_validation_views(camera):
    views = {
        "wild_deer_front.png": ((8.5, 0, 2.55), (0.3, 0, 2.0)),
        "wild_deer_side.png": ((0, -8.5, 2.55), (0.25, 0, 2.0)),
    }
    for filename, (location, target) in views.items():
        camera.location = location
        point_at(camera, target)
        bpy.context.scene.render.filepath = str(PREVIEW_DIR / filename)
        bpy.ops.render.render(write_still=True)


def main():
    ensure_output_directories()
    reset_scene()
    deer_collection, _root = add_deer()
    export_glb(deer_collection)
    camera = add_preview_setup()
    configure_render()
    render_validation_views(camera)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved Blender source: {BLEND_PATH}")
    print(f"Exported GLB: {GLB_PATH}")
    print(f"Saved validation renders: {PREVIEW_DIR}")


if __name__ == "__main__":
    main()
