"""Create and export a low-poly moonlit forest environment."""

from pathlib import Path
import math

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = REPO_ROOT / "assets" / "blender" / "night_forest.blend"
PREVIEW_PATH = REPO_ROOT / "assets" / "blender" / "previews" / "night_forest_preview.png"
GLB_PATH = REPO_ROOT / "web-app" / "public" / "models" / "forest" / "night_forest.glb"


def ensure_output_directories():
    BLEND_PATH.parent.mkdir(parents=True, exist_ok=True)
    PREVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    GLB_PATH.parent.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for material in list(bpy.data.materials):
        bpy.data.materials.remove(material)


def make_material(name, color, roughness=0.98):
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


def finish_mesh(obj, collection, parent, material, smooth=False):
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth
    obj.data.materials.append(material)
    obj.parent = parent
    move_to_collection(obj, collection)
    obj["forest_part"] = obj.name
    return obj


def add_terrain(collection, root, material):
    grid_size = 10
    span = 24.0
    vertices = []
    faces = []
    for row in range(grid_size + 1):
        y = -span / 2 + span * row / grid_size
        for column in range(grid_size + 1):
            x = -span / 2 + span * column / grid_size
            radius = math.sqrt(x * x + y * y)
            if radius < 5.2:
                z = 0.0
            else:
                z = (
                    math.sin(x * 0.48) * 0.18
                    + math.cos(y * 0.41) * 0.14
                    + min((radius - 5.2) * 0.025, 0.22)
                )
            vertices.append((x, y, z))

    stride = grid_size + 1
    for row in range(grid_size):
        for column in range(grid_size):
            index = row * stride + column
            faces.append((index, index + 1, index + stride + 1, index + stride))

    mesh = bpy.data.meshes.new("NightTerrainMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    terrain = bpy.data.objects.new("NightTerrain", mesh)
    collection.objects.link(terrain)
    terrain.parent = root
    terrain.data.materials.append(material)
    terrain["forest_part"] = terrain.name
    return terrain


def add_cylinder(collection, root, name, location, radius, depth, material, rotation=(0, 0, 0), top_radius=None):
    bpy.ops.mesh.primitive_cone_add(
        vertices=8,
        radius1=radius,
        radius2=top_radius if top_radius is not None else radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, collection, root, material)


def add_ico(collection, root, name, location, scale, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, collection, root, material, smooth=False)


def add_cone(collection, root, name, location, radius, depth, material, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(
        vertices=8,
        radius1=radius,
        radius2=0.08,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, collection, root, material)


def add_pine(collection, root, index, x, y, height, trunk, foliage_a, foliage_b):
    lean = math.radians(((index * 7) % 5) - 2)
    add_cylinder(
        collection, root, f"Pine_{index}_Trunk",
        (x, y, height * 0.42), 0.28 + height * 0.012, height * 0.84,
        trunk, rotation=(lean, 0, 0), top_radius=0.18,
    )
    for layer, (z_factor, radius_factor) in enumerate(((0.56, 0.23), (0.7, 0.19), (0.83, 0.14))):
        add_cone(
            collection, root, f"Pine_{index}_Crown_{layer}",
            (x, y, height * z_factor), height * radius_factor, height * 0.42,
            foliage_a if layer % 2 == 0 else foliage_b,
        )


def add_deciduous(collection, root, index, x, y, height, trunk, foliage_a, foliage_b):
    add_cylinder(
        collection, root, f"Oak_{index}_Trunk",
        (x, y, height * 0.38), 0.34 + height * 0.012, height * 0.76,
        trunk, top_radius=0.22,
    )
    crown_z = height * 0.78
    clusters = (
        (0, 0, 0, 1.0),
        (0.65, 0.05, -0.05, 0.68),
        (-0.55, 0.12, 0.08, 0.72),
        (0.05, -0.5, 0.18, 0.62),
    )
    for cluster_index, (dx, dy, dz, scale) in enumerate(clusters):
        add_ico(
            collection, root, f"Oak_{index}_Crown_{cluster_index}",
            (x + dx, y + dy, crown_z + dz),
            (1.25 * scale, 1.1 * scale, 1.05 * scale),
            foliage_a if cluster_index % 2 == 0 else foliage_b,
            rotation=(0, 0, index * 0.37),
        )


def add_undergrowth(collection, root, materials):
    rock, shrub_a, shrub_b, bark = materials
    rocks = ((-4.1, -1.2, 0.48), (3.8, 0.8, 0.62), (-1.1, 4.8, 0.55), (4.6, -3.6, 0.42))
    for index, (x, y, scale) in enumerate(rocks):
        add_ico(
            collection, root, f"Rock_{index}", (x, y, scale * 0.45),
            (scale * 1.2, scale, scale * 0.7), rock,
            rotation=(index * 0.3, index * 0.5, index * 0.7),
        )

    shrubs = ((-3.5, 1.2), (-2.4, 3.7), (2.9, 3.6), (4.0, -0.7), (-4.5, -3.4), (2.7, -4.2))
    for index, (x, y) in enumerate(shrubs):
        add_ico(
            collection, root, f"Shrub_{index}_A", (x - 0.28, y, 0.42),
            (0.65, 0.55, 0.48), shrub_a,
        )
        add_ico(
            collection, root, f"Shrub_{index}_B", (x + 0.3, y + 0.08, 0.38),
            (0.58, 0.5, 0.42), shrub_b,
        )

    add_cylinder(
        collection, root, "FallenLog", (3.5, 2.0, 0.38),
        0.32, 3.1, bark, rotation=(0, math.radians(88), math.radians(18)), top_radius=0.27,
    )

    grass_positions = ((-4.8, 0.2), (-3.2, -4.3), (-1.8, 4.5), (1.8, 4.8), (4.6, 1.9), (4.2, -4.4))
    for index, (x, y) in enumerate(grass_positions):
        for blade in range(3):
            add_cone(
                collection, root, f"Grass_{index}_{blade}",
                (x + (blade - 1) * 0.16, y + blade * 0.06, 0.3),
                0.1, 0.62, shrub_b,
                rotation=(math.radians((blade - 1) * 12), math.radians(blade * 7), 0),
            )


def add_forest():
    collection = bpy.data.collections.new("NightForest")
    bpy.context.scene.collection.children.link(collection)
    root = bpy.data.objects.new("NightForestRoot", None)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.5
    root["asset_type"] = "low_poly_night_forest"
    collection.objects.link(root)

    ground = make_material("Ground_Deep_Green", (0.025, 0.06, 0.035))
    clearing = make_material("Clearing_Forest_Floor", (0.055, 0.065, 0.035))
    bark = make_material("Bark_Dark", (0.085, 0.045, 0.025))
    bark_light = make_material("Bark_Mid", (0.13, 0.07, 0.032))
    foliage_a = make_material("Foliage_Pine", (0.018, 0.07, 0.045))
    foliage_b = make_material("Foliage_Moss", (0.035, 0.095, 0.045))
    rock = make_material("Rock_Cool_Gray", (0.12, 0.14, 0.14))

    add_terrain(collection, root, ground)
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=5.0, depth=0.045, location=(0, 0, 0.01))
    clearing_obj = bpy.context.object
    clearing_obj.name = "CentralClearing"
    finish_mesh(clearing_obj, collection, root, clearing)

    tree_positions = (
        (-7.4, -4.8, 7.2, "pine"),
        (-5.8, -1.0, 6.4, "oak"),
        (-7.0, 3.5, 7.8, "pine"),
        (-4.2, 6.2, 6.8, "oak"),
        (-0.8, 7.2, 8.2, "pine"),
        (3.2, 6.5, 7.0, "oak"),
        (6.7, 4.0, 8.0, "pine"),
        (6.2, 0.2, 6.5, "oak"),
        (7.2, -4.5, 7.6, "pine"),
        (4.6, -6.3, 6.9, "oak"),
        (-3.7, -6.5, 7.4, "pine"),
    )
    for index, (x, y, height, tree_type) in enumerate(tree_positions):
        if tree_type == "pine":
            add_pine(collection, root, index, x, y, height, bark, foliage_a, foliage_b)
        else:
            add_deciduous(collection, root, index, x, y, height, bark_light, foliage_a, foliage_b)

    add_undergrowth(collection, root, (rock, foliage_a, foliage_b, bark_light))
    return collection, root


def export_glb(collection):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in collection.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = collection.objects.get("NightForestRoot")
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


def render_preview():
    preview = bpy.data.collections.new("PreviewOnly")
    bpy.context.scene.collection.children.link(preview)

    bpy.ops.object.light_add(type="AREA", location=(-4, -6, 9))
    moon = bpy.context.object
    moon.name = "PreviewMoonlight"
    moon.data.energy = 1150
    moon.data.color = (0.38, 0.55, 0.82)
    moon.data.size = 5
    point_at(moon, (0, 0, 1))
    move_to_collection(moon, preview)

    bpy.ops.object.light_add(type="AREA", location=(5, -2, 3))
    fill = bpy.context.object
    fill.name = "PreviewFill"
    fill.data.energy = 260
    fill.data.color = (0.3, 0.2, 0.12)
    fill.data.size = 4
    point_at(fill, (0, 0, 1))
    move_to_collection(fill, preview)

    bpy.ops.object.camera_add(location=(0, -12.5, 5.6))
    camera = bpy.context.object
    camera.name = "PreviewCamera"
    camera.data.lens = 52
    point_at(camera, (0, 0, 1.25))
    move_to_collection(camera, preview)
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(PREVIEW_PATH)
    scene.world.color = (0.004, 0.008, 0.018)
    scene.view_settings.look = "AgX - Medium High Contrast"
    bpy.ops.render.render(write_still=True)


def main():
    ensure_output_directories()
    reset_scene()
    collection, _root = add_forest()
    export_glb(collection)
    render_preview()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
    print(f"Saved Blender source: {BLEND_PATH}")
    print(f"Exported GLB: {GLB_PATH}")
    print(f"Saved preview: {PREVIEW_PATH}")


if __name__ == "__main__":
    main()
