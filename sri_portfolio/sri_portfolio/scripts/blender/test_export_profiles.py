import unittest
from export_profiles import export_options, require_static_profile


class ExportProfileTests(unittest.TestCase):
    def test_legacy_static_is_allowed(self):
        require_static_profile("static")
        self.assertFalse(export_options("static")["export_extras"])

    def test_destructive_pipeline_rejects_every_semantic_profile(self):
        for profile in ("interactive", "vegetation", "rigged"):
            with self.subTest(profile=profile):
                with self.assertRaisesRegex(ValueError, "flattens"):
                    require_static_profile(profile)
                self.assertTrue(export_options(profile)["export_extras"])
                self.assertFalse(export_options(profile)["export_apply"])

    def test_rig_survives_export_policy(self):
        options = export_options("rigged")
        for key in ("export_skins", "export_morph", "export_animations"):
            self.assertTrue(options[key])

    def test_vegetation_preserves_motion_attributes(self):
        self.assertTrue(export_options("vegetation")["export_attributes"])
        self.assertEqual(export_options("vegetation")["export_vertex_color"], "ACTIVE")

    def test_unknown_profile_fails_closed(self):
        with self.assertRaises(ValueError):
            require_static_profile("riged")


if __name__ == "__main__":
    unittest.main()
