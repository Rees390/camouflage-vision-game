"""Create, validate, and export a low-poly adult fennec fox."""

from pathlib import Path
import math

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = REPO_ROOT / "assets" / "blender" / "fennec_fox.blend"
PREVIEW_DIR = REPO_ROOT / "assets" / "blender" / "previews"
GLB_PATH = REPO_ROOT / "web-app" / "public" / "models" / "desert" / "fennec_fox.glb"


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
        polygon.use_smooth = False
    obj.data.materials.append(material)
    obj.parent = parent
    obj["fox_part"] = obj.name
    move_to_collection(obj, collection)
    return obj


def add_sphere(collection, parent, name, location, scale, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=12,
        ring_count=6,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, collection, parent, material)


def add_cone(collection, parent, name, location, scale, rotation, material, vertices=7):
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
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


def add_ear(collection, parent, name, location, width, height, thickness, rotation, material):
    lower = -height * 0.42
    tip = height * 0.58
    vertices = [
        (thickness, -width, lower),
        (thickness, width, lower),
        (thickness * 0.3, 0, tip),
        (-thickness, -width, lower),
        (-thickness, width, lower),
        (-thickness * 0.3, 0, tip),
    ]
    faces = [
        (0, 1, 2),
        (5, 4, 3),
        (0, 3, 4, 1),
        (1, 4, 5, 2),
        (2, 5, 3, 0),
    ]
    mesh = bpy.data.meshes.new(f"{name}Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    collection.objects.link(obj)
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


def add_fox():
    fox_collection = bpy.data.collections.new("FennecFox")
    bpy.context.scene.collection.children.link(fox_collection)

    root = bpy.data.objects.new("FoxRoot", None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.25
    root["asset_type"] = "low_poly_fennec_fox"
    root["forward_axis"] = "+X"
    fox_collection.objects.link(root)

    sand = make_material("Fur_Sandy_Cream", (0.58, 0.36, 0.16))
    tan = make_material("Fur_Pale_Tan", (0.72, 0.5, 0.26))
    warm_shadow = make_material("Fur_Warm_Shadow", (0.38, 0.2, 0.075))
    underside = make_material("Fur_Light_Underside", (0.82, 0.68, 0.44))
    ear_inner = make_material("Ear_Inner_Muted", (0.34, 0.17, 0.11))
    features = make_material("Eyes_And_Nose", (0.018, 0.013, 0.009), 0.84)
    tail_tip = make_material("Tail_Dark_Tip", (0.25, 0.13, 0.055))

    parts = []
    parts.append(add_sphere(
        fox_collection, root, "Body",
        (0, 0, 1.02), (1.12, 0.42, 0.48), sand,
        rotation=(0, math.radians(-3), math.radians(1)),
    ))
    parts.append(add_sphere(
        fox_collection, root, "Chest",
        (0.73, -0.01, 1.12), (0.5, 0.4, 0.55), tan,
    ))
    parts.append(add_sphere(
        fox_collection, root, "Underside",
        (0.18, -0.01, 0.7), (0.78, 0.38, 0.14), underside,
    ))
    parts.append(add_sphere(
        fox_collection, root, "Neck",
        (0.88, -0.02, 1.48), (0.34, 0.34, 0.54), tan,
        rotation=(0, math.radians(-17), 0),
    ))

    head_pivot = bpy.data.objects.new("HeadPivot", None)
    head_pivot.empty_display_type = "PLAIN_AXES"
    head_pivot.empty_display_size = 0.16
    head_pivot.location = (1.18, -0.03, 1.75)
    head_pivot.rotation_euler.z = math.radians(-7)
    head_pivot.parent = root
    fox_collection.objects.link(head_pivot)

    parts.append(add_sphere(
        fox_collection, head_pivot, "Head",
        (0, 0, 0), (0.53, 0.35, 0.38), tan,
    ))
    parts.append(add_cone(
        fox_collection, head_pivot, "PointedMuzzle",
        (0.55, 0, -0.11), (0.27, 0.21, 0.44),
        (0, math.radians(90), 0), underside,
    ))
    parts.append(add_sphere(
        fox_collection, head_pivot, "Nose",
        (0.98, 0, -0.1), (0.09, 0.095, 0.08), features,
    ))

    ear_specs = (
        ("Near", (-0.02, -0.27, 0.5), 0.31, 1.08, 0.105, (math.radians(-5), math.radians(-4), math.radians(-8))),
        ("Far", (-0.09, 0.26, 0.47), 0.29, 0.98, 0.1, (math.radians(7), math.radians(5), math.radians(10))),
    )
    for side_name, location, width, height, thickness, rotation in ear_specs:
        parts.append(add_ear(
            fox_collection, head_pivot, f"Ear_{side_name}",
            location, width, height, thickness, rotation, warm_shadow,
        ))
        inner_location = (location[0] + 0.11, location[1], location[2] - height * 0.08)
        parts.append(add_ear(
            fox_collection, head_pivot, f"EarInner_{side_name}",
            inner_location, width * 0.58, height * 0.68, thickness * 0.24, rotation, ear_inner,
        ))

    parts.append(add_sphere(
        fox_collection, head_pivot, "Eye_Near",
        (0.29, -0.32, 0.08), (0.052, 0.032, 0.048), features,
    ))
    parts.append(add_sphere(
        fox_collection, head_pivot, "Eye_Far",
        (0.29, 0.32, 0.08), (0.052, 0.032, 0.048), features,
    ))

    legs = (
        ("FrontNear", (0.67, -0.29, 0.98), (0.73, -0.3, 0.5), (0.83, -0.31, 0.13)),
        ("FrontFar", (0.44, 0.28, 0.96), (0.4, 0.28, 0.48), (0.35, 0.28, 0.13)),
        ("RearNear", (-0.67, -0.29, 0.92), (-0.5, -0.3, 0.48), (-0.62, -0.31, 0.13)),
        ("RearFar", (-0.86, 0.27, 0.9), (-0.94, 0.27, 0.46), (-0.87, 0.27, 0.13)),
    )
    for name, hip, joint, ankle in legs:
        leg_material = tan if "Near" in name else warm_shadow
        parts.append(add_leg_segment(
            fox_collection, root, f"{name}_Upper", hip, joint, 0.085, leg_material,
        ))
        parts.append(add_sphere(
            fox_collection, root, f"{name}_Joint", joint, (0.095, 0.085, 0.095), leg_material,
        ))
        parts.append(add_leg_segment(
            fox_collection, root, f"{name}_Lower", joint, ankle, 0.065, leg_material,
        ))
        parts.append(add_sphere(
            fox_collection, root, f"{name}_Paw",
            (ankle[0] + 0.09, ankle[1], 0.075), (0.18, 0.11, 0.075), warm_shadow,
        ))

    parts.append(add_sphere(
        fox_collection, root, "Tail_Base",
        (-1.0, 0.09, 1.0), (0.65, 0.3, 0.29), sand,
        rotation=(math.radians(4), math.radians(-7), math.radians(-10)),
    ))
    parts.append(add_sphere(
        fox_collection, root, "Tail_Middle",
        (-1.62, 0.24, 0.87), (0.68, 0.34, 0.32), tan,
        rotation=(math.radians(5), math.radians(-9), math.radians(-13)),
    ))
    parts.append(add_sphere(
        fox_collection, root, "Tail_Tip",
        (-2.18, 0.4, 0.72), (0.48, 0.28, 0.26), tail_tip,
        rotation=(math.radians(5), math.radians(-12), math.radians(-16)),
    ))

    return fox_collection, root


def export_glb(fox_collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in fox_collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = fox_collection.objects.get("FoxRoot")
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
    ground.data.materials.append(make_material("PreviewGroundMaterial", (0.32, 0.19, 0.075)))

    for name, location, energy, size in (
        ("PreviewKey", (-3.5, -5.5, 6), 850, 4.5),
        ("PreviewFill", (4.5, -2, 4), 500, 3.5),
        ("PreviewRim", (0, 4, 5), 600, 3),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        point_at(light, (0, 0, 1.2))
        move_to_collection(light, preview_collection)

    bpy.ops.object.camera_add(location=(4.8, -6.8, 2.8))
    camera = bpy.context.object
    camera.name = "PreviewCamera"
    camera.data.lens = 58
    point_at(camera, (0, 0, 1.15))
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
    scene.world.color = (0.08, 0.055, 0.03)
    scene.view_settings.look = "AgX - Medium High Contrast"


def render_validation_views(camera):
    views = {
        "fennec_fox_front.png": ((5.8, 0, 2.2), (0.15, 0, 1.15)),
        "fennec_fox_three_quarter.png": ((4.8, -6.8, 2.8), (0, 0, 1.15)),
        "fennec_fox_side.png": ((0, -7.5, 2.25), (0, 0, 1.1)),
    }
    for filename, (location, target) in views.items():
        camera.location = location
        point_at(camera, target)
        bpy.context.scene.render.filepath = str(PREVIEW_DIR / filename)
        bpy.ops.render.render(write_still=True)


def main():
    ensure_output_directories()
    reset_scene()
    fox_collection, _root = add_fox()
    export_glb(fox_collection)
    camera = add_preview_setup()
    configure_render()
    render_validation_views(camera)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved Blender source: {BLEND_PATH}")
    print(f"Exported GLB: {GLB_PATH}")
    print(f"Saved validation renders: {PREVIEW_DIR}")


if __name__ == "__main__":
    main()
