<?php

/**
 * Class for reading in NBT-format files.
 *
 * @author  Justin Martin <frozenfire@thefrozenfire.com>
 * @author  Rick Selby <rick@selby-family.co.uk>
 */
namespace Pterodactyl\Players\Nbt;

class Service
{
    /** @var \Nbt\DataHandler **/
    private $dataHandler;

    /**
     * Ready the class; check if longs will be a problem.
     */
    public function __construct(DataHandler $dataHandler)
    {
        $this->dataHandler = $dataHandler;

        if (!$this->dataHandler->is64bit()) {
            /*
             *  GMP isn't required for 64-bit machines as we're handling signed ints. We can use native math instead.
             *  We still need to use GMP for 32-bit builds of PHP though.
             */
            if (!extension_loaded('gmp')) {
                trigger_error(
                    'The NBT class requires the GMP extension for 64-bit number handling on 32-bit PHP builds. '
                    .'Execution will continue, but will halt if a 64-bit number is handled.',
                    E_USER_NOTICE
                );
            }
        }
    }

    /**
     * Load a file and read the NBT data from the file.
     *
     * @param string $filename File to open
     * @param string $wrapper  [optional] Stream wrapper if not zlib
     *
     * @return Node|false
     */
    public function loadFile($filename, $wrapper = 'compress.zlib://')
    {
        if (is_file($filename)) {
            $fPtr = fopen("{$wrapper}{$filename}", 'rb');

            return $this->readFilePointer($fPtr);
        } else {
            trigger_error('First parameter must be a filename.', E_USER_WARNING);

            return false;
        }
    }

    /**
     * Write the current NBT root data to a file.
     *
     * @param string $filename File to write to
     * @param Node   $tree     Root of the tree to write
     * @param string $wrapper  [optional] Stream wrapper if not zlib
     *
     * @return true
     */
    public function writeFile($filename, Node $tree, $wrapper = 'compress.zlib://')
    {
        $fPtr = fopen("{$wrapper}{$filename}", 'wb');
        $this->writeFilePointer($fPtr, $tree);
        fclose($fPtr);
    }

    /**
     * Read NBT data from the given file pointer.
     *
     * @param resource $fPtr File/Stream pointer
     *
     * @return Node|false
     */
    public function readFilePointer($fPtr)
    {
        $treeRoot = new Node();

        $success = $this->traverseTag($fPtr, $treeRoot);

        if ($success) {
            return $treeRoot;
        } else {
            return false;
        }
    }

    /**
     * Write the current NBT root data to the given file pointer.
     *
     * @param resource $fPtr File/Stream pointer
     * @param Node     $tree Root of the tree to write
     */
    public function writeFilePointer($fPtr, Node $tree)
    {
        if (!$this->writeTag($fPtr, $tree)) {
            trigger_error('Failed to write tree to file/resource.', E_USER_WARNING);
            return false;
        }
    }

    /**
     * Read NBT data from a string.
     *
     * @param string $string String containing NBT data
     *
     * @return Node|false
     */
    public function readString($string)
    {
        $stream = fopen('php://memory', 'r+b');
        fwrite($stream, $string);
        rewind($stream);

        return $this->readFilePointer($stream);
    }

    /**
     * Get a string with the current NBT root data in NBT format.
     *
     * @param Node $tree Root of the tree to write
     *
     * @return string
     */
    public function writeString(Node $tree)
    {
        $stream = fopen('php://memory', 'r+b');
        $this->writeFilePointer($stream, $tree);
        rewind($stream);

        return stream_get_contents($stream);
    }
    
    /**
     * Read player data from binary NBT data.
     *
     * @param string $data Binary player data
     * @return array Processed player data
     */
    public function readPlayerData($data)
    {
        // Try to decompress the data if it's compressed
        try {
            $decompressedData = zlib_decode($data);
            if ($decompressedData !== false) {
                $data = $decompressedData;
            }
        } catch (\Exception $e) {
            // Ignore decompression errors, try to parse as-is
        }
        
        // Parse NBT data
        $tree = $this->readString($data);
        if (!$tree) {
            throw new \Exception('Failed to parse NBT data');
        }
        
        // Extract player data
        return $this->extractPlayerData($tree);
    }
    
    /**
     * Extract player data from NBT tree.
     *
     * @param Node $tree NBT tree
     * @return array Processed player data
     */
    private function extractPlayerData(Node $tree)
    {
        $data = [];
        
        // Process inventory
        $inventoryNode = $tree->findChildByName('Inventory');
        if ($inventoryNode && $inventoryNode->getChildren()) {
            $data['Inventory'] = [];
            foreach ($inventoryNode->getChildren() as $itemNode) {
                $item = $this->parseNbtItem($itemNode);
                if (!empty($item)) {
                    $data['Inventory'][] = $item;
                }
            }
        }
        
        // Process ender chest
        $enderChestNode = $tree->findChildByName('EnderItems');
        if ($enderChestNode && $enderChestNode->getChildren()) {
            $data['EnderItems'] = [];
            foreach ($enderChestNode->getChildren() as $itemNode) {
                $item = $this->parseNbtItem($itemNode);
                if (!empty($item)) {
                    $data['EnderItems'][] = $item;
                }
            }
        }
        
        // Extract other player data
        $this->extractBasicPlayerData($tree, $data);
        
        return $data;
    }
    
    /**
     * Extract basic player data from NBT tree.
     *
     * @param Node $tree NBT tree
     * @param array &$data Data array to populate
     */
    private function extractBasicPlayerData(Node $tree, array &$data)
    {
        // Health
        $healthNode = $tree->findChildByName('Health');
        if ($healthNode) {
            $data['Health'] = $healthNode->getValue();
        }
        
        // Food level
        $foodLevelNode = $tree->findChildByName('foodLevel');
        if ($foodLevelNode) {
            $data['foodLevel'] = $foodLevelNode->getValue();
        }
        
        // Food saturation
        $foodSaturationNode = $tree->findChildByName('foodSaturationLevel');
        if ($foodSaturationNode) {
            $data['foodSaturationLevel'] = $foodSaturationNode->getValue();
        }
        
        // XP level
        $xpLevelNode = $tree->findChildByName('XpLevel');
        if ($xpLevelNode) {
            $data['XpLevel'] = $xpLevelNode->getValue();
        }
        
        // XP progress
        $xpPNode = $tree->findChildByName('XpP');
        if ($xpPNode) {
            $data['XpP'] = $xpPNode->getValue();
        }
    }
    
    /**
     * Parse NBT item data.
     *
     * @param Node $itemNode Item node
     * @return array Processed item data
     */
    private function parseNbtItem(Node $itemNode)
    {
        $item = [];
        
        // Get item ID
        $idNode = $itemNode->findChildByName('id');
        if ($idNode) {
            $item['id'] = $idNode->getValue();
        } else {
            return []; // Skip items without ID
        }
        
        // Get item count
        $countNode = $itemNode->findChildByName('Count');
        if ($countNode) {
            $item['count'] = $countNode->getValue();
        }
        
        // Get item slot
        $slotNode = $itemNode->findChildByName('Slot');
        if ($slotNode) {
            $item['slot'] = $slotNode->getValue();
        }
        
        // Get item damage/data value
        $damageNode = $itemNode->findChildByName('Damage');
        if ($damageNode) {
            $item['damage'] = $damageNode->getValue();
        }
        
        // Get item tag data (enchantments, display name, etc)
        $tagNode = $itemNode->findChildByName('tag');
        if ($tagNode) {
            $this->parseItemTag($tagNode, $item);
        }
        
        return $item;
    }
    
    /**
     * Parse item tag data.
     *
     * @param Node $tagNode Tag node
     * @param array &$item Item data to populate
     */
    private function parseItemTag(Node $tagNode, array &$item)
    {
        // Get display data (custom name, lore)
        $displayNode = $tagNode->findChildByName('display');
        if ($displayNode) {
            $nameNode = $displayNode->findChildByName('Name');
            if ($nameNode) {
                $item['displayName'] = $nameNode->getValue();
            }
            
            $loreNode = $displayNode->findChildByName('Lore');
            if ($loreNode && $loreNode->getChildren()) {
                $item['lore'] = [];
                foreach ($loreNode->getChildren() as $loreLineNode) {
                    $item['lore'][] = $loreLineNode->getValue();
                }
            }
        }
        
        // Get enchantments
        $enchNode = $tagNode->findChildByName('Enchantments');
        if ($enchNode && $enchNode->getChildren()) {
            $item['enchantments'] = [];
            foreach ($enchNode->getChildren() as $enchantmentNode) {
                $enchantment = [];
                
                $idNode = $enchantmentNode->findChildByName('id');
                if ($idNode) {
                    $enchantment['id'] = $idNode->getValue();
                }
                
                $lvlNode = $enchantmentNode->findChildByName('lvl');
                if ($lvlNode) {
                    $enchantment['level'] = $lvlNode->getValue();
                }
                
                if (!empty($enchantment)) {
                    $item['enchantments'][] = $enchantment;
                }
            }
        }
    }

    /**
     * Read the next tag from the stream.
     *
     * @param resource $fPtr Stream pointer
     * @param Node     $node Tree array to write to
     *
     * @return bool
     */
    private function traverseTag($fPtr, Node &$node)
    {
        if (feof($fPtr)) {
            return false;
        }
        // Read type byte
        $tagType = $this->dataHandler->getTAGByte($fPtr);
        if ($tagType == Tag::TAG_END) {
            return false;
        } else {
            $node->setType($tagType);
            $tagName = $this->dataHandler->getTAGString($fPtr);
            $node->setName($tagName);
            $this->readType($fPtr, $tagType, $node);

            return true;
        }
    }

    /**
     * Write the given tag to the stream.
     *
     * @param resource $fPtr Stream pointer
     * @param Node     $node Tag to write
     *
     * @return bool
     */
    private function writeTag($fPtr, Node $node)
    {
        return $this->dataHandler->putTAGByte($fPtr, $node->getType())
            && $this->dataHandler->putTAGString($fPtr, $node->getName())
            && $this->writeType($fPtr, $node->getType(), $node);
    }

    /**
     * Read an individual type from the stream.
     *
     * @param resource $fPtr    Stream pointer
     * @param int      $tagType Tag to read
     * @param Node     $node    Node to add data to
     *
     * @return mixed
     */
    private function readType($fPtr, $tagType, Node $node)
    {
        switch ($tagType) {
            case Tag::TAG_BYTE: // Signed byte (8 bit)
                $node->setValue($this->dataHandler->getTAGByte($fPtr));
                break;
            case Tag::TAG_SHORT: // Signed short (16 bit, big endian)
                $node->setValue($this->dataHandler->getTAGShort($fPtr));
                break;
            case Tag::TAG_INT: // Signed integer (32 bit, big endian)
                $node->setValue($this->dataHandler->getTAGInt($fPtr));
                break;
            case Tag::TAG_LONG: // Signed long (64 bit, big endian)
                $node->setValue($this->dataHandler->getTAGLong($fPtr));
                break;
            case Tag::TAG_FLOAT: // Floating point value (32 bit, big endian, IEEE 754-2008)
                $node->setValue($this->dataHandler->getTAGFloat($fPtr));
                break;
            case Tag::TAG_DOUBLE: // Double value (64 bit, big endian, IEEE 754-2008)
                $node->setValue($this->dataHandler->getTAGDouble($fPtr));
                break;
            case Tag::TAG_BYTE_ARRAY: // Byte array
                $node->setValue($this->dataHandler->getTAGByteArray($fPtr));
                break;
            case Tag::TAG_STRING: // String
                $node->setValue($this->dataHandler->getTAGString($fPtr));
                break;
            case Tag::TAG_INT_ARRAY:
                $node->setValue($this->dataHandler->getTAGIntArray($fPtr));
                break;
            case Tag::TAG_LIST: // List
                $tagID = $this->dataHandler->getTAGByte($fPtr);
                $listLength = $this->dataHandler->getTAGInt($fPtr);

                // Add a reference to the payload type
                $node->setPayloadType($tagID);

                for ($i = 0; $i < $listLength; ++$i) {
                    if (feof($fPtr)) {
                        break;
                    }
                    $listNode = new Node();
                    $this->readType($fPtr, $tagID, $listNode);
                    $node->addChild($listNode);
                }
                break;
            case Tag::TAG_COMPOUND: // Compound
                // Uck. Don't know a better way to do this,
                $compoundNode = new Node();
                while ($this->traverseTag($fPtr, $compoundNode)) {
                    $node->addChild($compoundNode);
                    // Reset the node for adding the next tags
                    $compoundNode = new Node();
                }
                break;
        }
    }

    /**
     * Write an individual type to the stream.
     *
     * @param resource $fPtr    Stream pointer
     * @param int      $tagType Type of tag to write
     * @param Node     $node    Node containing value to write
     *
     * @return bool
     */
    private function writeType($fPtr, $tagType, Node $node)
    {
        switch ($tagType) {
            case Tag::TAG_BYTE: // Signed byte (8 bit)
                return $this->dataHandler->putTAGByte($fPtr, $node->getValue());
            case Tag::TAG_SHORT: // Signed short (16 bit, big endian)
                return $this->dataHandler->putTAGShort($fPtr, $node->getValue());
            case Tag::TAG_INT: // Signed integer (32 bit, big endian)
                return $this->dataHandler->putTAGInt($fPtr, $node->getValue());
            case Tag::TAG_LONG: // Signed long (64 bit, big endian)
                return $this->dataHandler->putTAGLong($fPtr, $node->getValue());
            case Tag::TAG_FLOAT: // Floating point value (32 bit, big endian, IEEE 754-2008)
                return $this->dataHandler->putTAGFloat($fPtr, $node->getValue());
            case Tag::TAG_DOUBLE: // Double value (64 bit, big endian, IEEE 754-2008)
                return $this->dataHandler->putTAGDouble($fPtr, $node->getValue());
            case Tag::TAG_BYTE_ARRAY: // Byte array
                return $this->dataHandler->putTAGByteArray($fPtr, $node->getValue());
            case Tag::TAG_STRING: // String
                return $this->dataHandler->putTAGString($fPtr, $node->getValue());
            case Tag::TAG_INT_ARRAY: // Byte array
                return $this->dataHandler->putTAGIntArray($fPtr, $node->getValue());
            case Tag::TAG_LIST: // List
                if (!($this->dataHandler->putTAGByte($fPtr, $node->getPayloadType())
                    && $this->dataHandler->putTAGInt($fPtr, count($node->getChildren()))
                    )) {
                    return false;
                }
                foreach ($node->getChildren() as $childNode) {
                    if (!$this->writeType($fPtr, $node->getPayloadType(), $childNode)) {
                        return false;
                    }
                }

                return true;
            case Tag::TAG_COMPOUND: // Compound
                foreach ($node->getChildren() as $childNode) {
                    if (!$this->writeTag($fPtr, $childNode)) {
                        return false;
                    }
                }
                if (!$this->writeType($fPtr, Tag::TAG_END, new Node())) {
                    return false;
                }

                return true;
            case Tag::TAG_END: // End tag
                return is_int(fwrite($fPtr, "\0"));
        }
    }
}
